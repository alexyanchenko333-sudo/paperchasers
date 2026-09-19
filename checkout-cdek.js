/* CHECKOUT CDEK — CITY + PICKUP linked system, mock-ready
   MOCK: window.MOCK_CITIES / window.MOCK_CDEK_PVZ via fetchMockCities / fetchMockCdekPoints
   MAP: window.createCdekMap (mock now, ymaps3 later) — keep same API
   State: selectedCity {name, latitude, longitude}, selectedPickupPoint {id, name, city, address, latitude, longitude, workTime}
   Persistence: localStorage pc_city_v1 + pc_pickup_point_v1
   Later: replace fetchMock* -> /api/cdek/* and createCdekMap internals -> ymaps3, no checkout rewrite
*/
(function(){
  const CITY_KEY = 'pc_city_v1';
  const PICKUP_KEY = 'pc_pickup_point_v1';
  const DELIVERY_KEY = 'pc_delivery_v1';

  function loadCity(){ try{ const v=localStorage.getItem(CITY_KEY); return v?JSON.parse(v):null; }catch(e){return null;} }
  function saveCity(c){ try{ if(c) localStorage.setItem(CITY_KEY, JSON.stringify(c)); else localStorage.removeItem(CITY_KEY);}catch(e){} }
  function loadPickup(){ try{ const v=localStorage.getItem(PICKUP_KEY); return v?JSON.parse(v):null; }catch(e){return null;} }
  function savePickup(p){ try{ if(p) localStorage.setItem(PICKUP_KEY, JSON.stringify(p)); else localStorage.removeItem(PICKUP_KEY);}catch(e){} }
  function loadDelivery(){ try{ return localStorage.getItem(DELIVERY_KEY)||'cdek_pickup'; }catch(e){return 'cdek_pickup';} }
  function saveDelivery(v){ try{ localStorage.setItem(DELIVERY_KEY, v);}catch(e){} }

  window.getSelectedCity = loadCity;
  window.getSelectedPickupPoint = loadPickup;
  window.getSelectedDelivery = loadDelivery;

  document.addEventListener('DOMContentLoaded', ()=>{
    const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
    const pickupBlock = document.getElementById('pickupBlock');
    const cityInput = document.getElementById('cityInput');
    const citySuggestions = document.getElementById('citySuggestions');
    const cityNoResults = document.getElementById('cityNoResults');
    const pickupInput = document.getElementById('pickupInput');
    const pickupSuggestions = document.getElementById('pickupSuggestions');
    const pickupNoResults = document.getElementById('pickupNoResults');
    const pickupSelected = document.getElementById('pickupSelected');
    const selectedAddr = document.getElementById('selectedAddr');
    const selectedIdCity = document.getElementById('selectedIdCity');
    const selectedNote = document.getElementById('selectedNote');
    const selectedPhone = document.getElementById('selectedPhone');
    const changeBtn = document.getElementById('changePickupBtn');
    const pickupMapWrap = document.getElementById('pickupMapWrap');
    const cdekMapEl = document.getElementById('cdekMap');
    const cdekLoadingMap = document.getElementById('cdekLoadingMap');
    const cdekNoResultsMap = document.getElementById('cdekNoResultsMap');
    const cdekCard = document.getElementById('cdekCard');
    const cardAddr = document.getElementById('cardAddr');
    const cardCity = document.getElementById('cardCity');
    const cardTime = document.getElementById('cardTime');
    const cardSelectBtn = document.getElementById('cardSelectBtn');
    const pickupLoading = document.getElementById('pickupLoading');
    const pickupError = document.getElementById('pickupError');

    if(!pickupBlock || !cityInput || !pickupInput) return;

    let selectedCity = loadCity();
    let selectedPickup = loadPickup();
    let citySearch = selectedCity ? selectedCity.name : '';
    let pickupSearch = '';
    let allCityPoints = [];
    let mapInstance = null;
    let pendingPoint = null;
    let cityActiveIndex = -1;
    let pickupActiveIndex = -1;

    function updateDeliveryVisibility(){
      const val = document.querySelector('input[name="delivery"]:checked');
      const v = val ? val.value : 'cdek_pickup';
      saveDelivery(v);
      pickupBlock.style.display = v === 'cdek_pickup' ? 'block' : 'none';
      // require pickup if cdek
      if(pickupInput) pickupInput.required = (v === 'cdek_pickup');
      if(cityInput) cityInput.required = (v === 'cdek_pickup');
    }
    deliveryRadios.forEach(r=> r.addEventListener('change', updateDeliveryVisibility));
    updateDeliveryVisibility();

    function showSelected(point){
      if(!point){
        pickupSelected.style.display='none';
        return;
      }
      pickupSelected.style.display='block';
      // hide map after selection — as per ref: карта скрывается
      if(pickupMapWrap) pickupMapWrap.style.display='none';
      cdekCard.style.display='none';
      const idCity = point.id + ', ' + point.city + ', ' + point.address.split(',')[0];
      if(selectedIdCity) selectedIdCity.textContent = idCity;
      selectedAddr.textContent = point.address;
      if(selectedNote){
        if(point.note){
          selectedNote.textContent = point.note;
          selectedNote.style.display='block';
        } else {
          selectedNote.style.display='none';
        }
      }
      selectedTime.textContent = point.workTime;
      if(selectedPhone) selectedPhone.textContent = point.phone || '';
    }

    function clearPickup(){
      selectedPickup = null;
      pickupSearch = '';
      pickupInput.value = '';
      pickupInput.disabled = !selectedCity;
      pickupInput.style.opacity = selectedCity ? '1' : '0.6';
      pickupInput.style.background = selectedCity ? 'var(--paper-white)' : 'var(--paper)';
      pickupSuggestions.style.display='none';
      pickupNoResults.style.display='none';
      pickupSelected.style.display='none';
      cdekCard.style.display='none';
      savePickup(null);
      if(mapInstance) mapInstance.setSelectedId(null);
    }

    function setCity(cityObj, opts){
      opts = opts || {};
      selectedCity = cityObj;
      citySearch = cityObj.name;
      cityInput.value = cityObj.name;
      citySuggestions.style.display='none';
      cityNoResults.style.display='none';
      saveCity(cityObj);
      // reset pickup
      clearPickup();
      pickupInput.disabled = false;
      pickupInput.style.opacity='1';
      pickupInput.style.background='var(--paper-white)';
      if(!opts.silent) pickupInput.focus();
      // map: move to city and load points
      ensureMap().then(()=>{
        mapInstance.setCenter({lat: cityObj.latitude, lng: cityObj.longitude, zoom: 11});
        return loadPointsForCity(cityObj.name);
      }).then(points=>{
        if(mapInstance) mapInstance.setPoints(points);
        pickupMapWrap.style.display='block';
        cdekNoResultsMap.style.display = points.length ? 'none' : 'block';
      }).catch(()=>{});
    }

    function setPickup(point, opts){
      opts = opts || {};
      selectedPickup = point;
      pickupSearch = point.address;
      pickupInput.value = point.address;
      pickupSuggestions.style.display='none';
      pickupNoResults.style.display='none';
      savePickup(point);
      showSelected(point);
      // keep map hidden per ref — only selected info remains
      // card is for map marker pre-select, not needed here
      cdekCard.style.display='none';
      pendingPoint=null;
    }

    async function ensureMap(){
      if(mapInstance) return mapInstance;
      cdekLoadingMap.style.display='block';
      mapInstance = window.createCdekMap(cdekMapEl, {
        onPointSelect: (point)=>{
          // marker -> autocomplete
          pendingPoint = point;
          cardAddr.textContent = point.address;
          cardCity.textContent = point.city;
          cardTime.textContent = point.workTime;
          cdekCard.style.display='block';
        },
        onClusterClick: ()=>{}
      });
      cdekLoadingMap.style.display='none';
      return mapInstance;
    }

    async function loadPointsForCity(cityName){
      pickupLoading.style.display='block';
      pickupError.style.display='none';
      try{
        const points = await window.fetchMockCdekPoints({city: cityName});
        allCityPoints = points;
        return points;
      } catch(e){
        pickupError.style.display='block';
        pickupError.textContent='Unable to load pickup points.';
        return [];
      } finally {
        pickupLoading.style.display='none';
      }
    }

    function renderCitySuggestions(list){
      citySuggestions.innerHTML='';
      if(!list.length){
        citySuggestions.style.display='none';
        return;
      }
      list.forEach((c, idx)=>{
        const div = document.createElement('div');
        div.className='autocomplete-item' + (idx===cityActiveIndex ? ' active':'');
        div.innerHTML=`<div class="ac-city">${c.name}</div>`;
        div.addEventListener('mousedown', (e)=>{ e.preventDefault(); setCity(c); });
        citySuggestions.appendChild(div);
      });
      citySuggestions.style.display='block';
    }

    function renderPickupSuggestions(list){
      pickupSuggestions.innerHTML='';
      if(!list.length){
        pickupSuggestions.style.display='none';
        if(pickupInput.value.trim()) pickupNoResults.style.display='block';
        else pickupNoResults.style.display='none';
        return;
      }
      pickupNoResults.style.display='none';
      list.forEach((p, idx)=>{
        const div = document.createElement('div');
        div.className='autocomplete-item' + (idx===pickupActiveIndex ? ' active':'');
        div.innerHTML=`<div class="ac-city">CDEK</div><div class="ac-addr">${p.address} — ${p.city}</div><div style="font-size:10px; color:var(--carbon);">${p.workTime}</div>`;
        div.addEventListener('mousedown', (e)=>{ e.preventDefault(); setPickup(p); pickupSuggestions.style.display='none'; });
        pickupSuggestions.appendChild(div);
      });
      pickupSuggestions.style.display='block';
    }

    // City autocomplete
    let cityDebounce=null;
    cityInput.addEventListener('input', ()=>{
      const q = cityInput.value.trim();
      citySearch = q;
      cityActiveIndex=-1;
      // if cleared, reset city
      if(!q){
        selectedCity=null;
        saveCity(null);
        clearPickup();
        citySuggestions.style.display='none';
        cityNoResults.style.display='none';
        pickupMapWrap.style.display='none';
        if(mapInstance) mapInstance.setPoints([]);
        return;
      }
      clearTimeout(cityDebounce);
      cityDebounce=setTimeout(async ()=>{
        if(!q) return;
        try{
          const list = await window.fetchMockCities(q);
          if(list.length===0){
            citySuggestions.style.display='none';
            cityNoResults.style.display='block';
          } else {
            cityNoResults.style.display='none';
            renderCitySuggestions(list);
          }
        }catch(e){
          cityNoResults.style.display='block';
        }
      }, 220);
    });

    cityInput.addEventListener('keydown', (e)=>{
      const items = citySuggestions.querySelectorAll('.autocomplete-item');
      if(e.key==='ArrowDown'){
        e.preventDefault(); cityActiveIndex = Math.min(cityActiveIndex+1, items.length-1); renderCitySuggestions(Array.from(items).map(el=>({name: el.querySelector('.ac-city').textContent}))); // re-render will keep active, but simpler: toggle class
        items.forEach((el,i)=> el.classList.toggle('active', i===cityActiveIndex));
        if(items[cityActiveIndex]) items[cityActiveIndex].scrollIntoView({block:'nearest'});
      } else if(e.key==='ArrowUp'){
        e.preventDefault(); cityActiveIndex = Math.max(cityActiveIndex-1, 0); items.forEach((el,i)=> el.classList.toggle('active', i===cityActiveIndex));
      } else if(e.key==='Enter'){
        if(cityActiveIndex>=0 && items[cityActiveIndex]){
          e.preventDefault(); items[cityActiveIndex].dispatchEvent(new Event('mousedown'));
        }
      } else if(e.key==='Escape'){
        citySuggestions.style.display='none';
      }
    });

    cityInput.addEventListener('focus', ()=>{
      const q = cityInput.value.trim();
      if(q){
        window.fetchMockCities(q).then(list=>{
          if(list.length) renderCitySuggestions(list);
        });
      }
    });

    // Pickup autocomplete
    let pickupDebounce=null;
    pickupInput.addEventListener('input', ()=>{
      if(!selectedCity){
        pickupSuggestions.style.display='none';
        return;
      }
      const q = pickupInput.value.trim();
      pickupSearch = q;
      pickupActiveIndex=-1;
      clearTimeout(pickupDebounce);
      pickupDebounce=setTimeout(()=>{
        let list = allCityPoints.slice();
        if(q){
          const qq = q.toLowerCase();
          list = list.filter(p => (p.address + ' ' + p.name + ' ' + p.id).toLowerCase().includes(qq));
        }
        if(!list.length && q){
          pickupSuggestions.style.display='none';
          pickupNoResults.style.display='block';
          if(mapInstance) mapInstance.setPoints([]);
          cdekNoResultsMap.style.display='block';
        } else {
          pickupNoResults.style.display='none';
          cdekNoResultsMap.style.display='none';
          renderPickupSuggestions(list);
          if(mapInstance) mapInstance.setPoints(list);
        }
      }, 180);
    });

    pickupInput.addEventListener('focus', ()=>{
      if(!selectedCity) return;
      if(!allCityPoints.length) return;
      const q = pickupInput.value.trim().toLowerCase();
      let list = allCityPoints;
      if(q) list = list.filter(p => (p.address + ' ' + p.name).toLowerCase().includes(q));
      renderPickupSuggestions(list);
    });

    pickupInput.addEventListener('keydown', (e)=>{
      const items = pickupSuggestions.querySelectorAll('.autocomplete-item');
      if(e.key==='ArrowDown'){
        e.preventDefault(); pickupActiveIndex = Math.min(pickupActiveIndex+1, items.length-1); items.forEach((el,i)=> el.classList.toggle('active', i===pickupActiveIndex));
        if(items[pickupActiveIndex]) items[pickupActiveIndex].scrollIntoView({block:'nearest'});
      } else if(e.key==='ArrowUp'){
        e.preventDefault(); pickupActiveIndex = Math.max(pickupActiveIndex-1, 0); items.forEach((el,i)=> el.classList.toggle('active', i===pickupActiveIndex));
      } else if(e.key==='Enter'){
        if(pickupActiveIndex>=0 && items[pickupActiveIndex]){
          e.preventDefault(); items[pickupActiveIndex].dispatchEvent(new Event('mousedown'));
        }
      } else if(e.key==='Escape'){
        pickupSuggestions.style.display='none';
      }
    });

    // Outside click close
    document.addEventListener('click', (e)=>{
      if(!e.target.closest('.autocomplete-wrap')){
        citySuggestions.style.display='none';
        pickupSuggestions.style.display='none';
      }
    });

    // Map card SELECT
    if(cardSelectBtn) cardSelectBtn.addEventListener('click', ()=>{
      if(!pendingPoint) return;
      setPickup(pendingPoint);
      cdekCard.style.display='none';
      pendingPoint=null;
    });

    // CHANGE
    if(changeBtn) changeBtn.addEventListener('click', ()=>{
      pickupSelected.style.display='none';
      savePickup(null);
      selectedPickup=null;
      pickupInput.value='';
      pickupInput.focus();
      if(mapInstance) mapInstance.setSelectedId(null);
      // show map again for reselection
      pickupMapWrap.style.display='block';
      if(selectedCity && allCityPoints.length){
        renderPickupSuggestions(allCityPoints);
        if(mapInstance){
          mapInstance.setPoints(allCityPoints);
          mapInstance.setCenter({lat: selectedCity.latitude, lng: selectedCity.longitude, zoom: 11});
        }
        cdekCard.style.display='none';
      }
    });

    // Restore from storage
    if(selectedCity){
      cityInput.value = selectedCity.name;
      pickupInput.disabled = false;
      pickupInput.style.opacity='1';
      pickupInput.style.background='var(--paper-white)';
      // load points and map
      ensureMap().then(()=> loadPointsForCity(selectedCity.name)).then(points=>{
        if(mapInstance) {
          mapInstance.setPoints(points);
          mapInstance.setCenter({lat: selectedCity.latitude, lng: selectedCity.longitude, zoom: 11});
        }
        if(selectedCity) pickupMapWrap.style.display='block';
        if(selectedPickup){
          // verify pickup belongs to city, otherwise clear
          const found = points.find(p=> p.id===selectedPickup.id);
          if(found){
            showSelected(found);
            pickupInput.value = found.address;
            // keep map hidden after restore as per ref (only info)
            if(pickupMapWrap) pickupMapWrap.style.display='none';
            if(mapInstance){
              mapInstance.setSelectedId(found.id);
            }
          } else {
            clearPickup();
          }
        } else {
          // no pickup, show map with points
          if(points.length) pickupMapWrap.style.display='block';
        }
      });
    } else {
      pickupInput.disabled = true;
      pickupInput.style.opacity='0.6';
      pickupInput.style.background='var(--paper)';
    }

    // Ensure map is created lazily on first focus of city/pickup or when delivery shown
    // Do not auto-open map until city selected
  });
})();
