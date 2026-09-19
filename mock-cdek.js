/* MOCK CDEK DATA LAYER — replace with real CDEK API later
   Real API: CDEK v2 /deliverypoints?city=Москва  -> {id, name, city, address, latitude, longitude, workTime, phone, note}
   And city search -> geocode / city list. Keep structure 1-1.
   This file is the ONLY place with mock data. */

window.MOCK_CITIES = [
  { name: 'Москва',          latitude: 55.7558, longitude: 37.6173 },
  { name: 'Санкт-Петербург', latitude: 59.9343, longitude: 30.3351 },
  { name: 'Казань',           latitude: 55.7887, longitude: 49.1221 },
  { name: 'Екатеринбург',    latitude: 56.8389, longitude: 60.6057 },
  { name: 'Новосибирск',     latitude: 55.0084, longitude: 82.9357 },
  { name: 'Самара',          latitude: 53.2415, longitude: 50.2212 },
  { name: 'Нижний Новгород',  latitude: 56.2965, longitude: 43.9361 },
  { name: 'Ростов-на-Дону',   latitude: 47.2225, longitude: 39.7183 }
];

window.MOCK_CDEK_PVZ = [
  { id: 'MSK001', name: 'CDEK', city: 'Москва',          address: 'ул. Тверская, 15',        latitude: 55.7611, longitude: 37.6063, workTime: 'Пн-Пт 10:00-21:00, Сб-Вс 10:00-20:00', phone: '+74950001001', note: '' },
  { id: 'MSK002', name: 'CDEK', city: 'Москва',          address: 'ул. Большая Никитская, 24', latitude: 55.7550, longitude: 37.6050, workTime: 'Пн-Пт 09:00-21:00, Сб-Вс 10:00-20:00', phone: '+74950001002', note: '' },
  { id: 'MSK003', name: 'CDEK', city: 'Москва',          address: 'Кутузовский пр-т, 36',    latitude: 55.7405, longitude: 37.5163, workTime: 'Пн-Пт 10:00-20:00, Сб-Вс 10:00-19:00', phone: '+74950001003', note: '' },
  { id: 'MSK004', name: 'CDEK', city: 'Москва',          address: 'ул. Арбат, 4',            latitude: 55.7520, longitude: 37.5910, workTime: 'Пн-Пт 09:00-21:00, Сб-Вс 10:00-20:00', phone: '+74950001004', note: '' },
  { id: 'MSK005', name: 'CDEK', city: 'Москва',          address: 'Ленинский пр-т, 34',      latitude: 55.7022, longitude: 37.5841, workTime: 'Пн-Пт 10:00-22:00, Сб-Вс 10:00-21:00', phone: '+74950001005', note: '' },
  { id: 'SPB001', name: 'CDEK', city: 'Санкт-Петербург', address: 'Невский пр-т, 88',        latitude: 59.9329, longitude: 30.3345, workTime: 'Пн-Пт 09:00-22:00, Сб-Вс 10:00-21:00', phone: '+78120001001', note: '' },
  { id: 'SPB002', name: 'CDEK', city: 'Санкт-Петербург', address: 'ул. Садовая, 28',         latitude: 59.9272, longitude: 30.3290, workTime: 'Пн-Пт 09:00-21:00, Сб-Вс 10:00-20:00', phone: '+78120001002', note: '' },
  { id: 'SPB003', name: 'CDEK', city: 'Санкт-Петербург', address: 'ул. Московский пр-т, 109', latitude: 59.9000, longitude: 30.3160, workTime: 'Пн-Пт 09:00-21:00, Сб-Вс 10:00-20:00', phone: '+78120001003', note: '' },
  { id: 'SMR001', name: 'CDEK', city: 'Самара',          address: 'ул. Ленина, 24',          latitude: 53.1959, longitude: 50.1011, workTime: 'Пн-Пт 09:00-21:00, Сб-Вс 10:00-19:00', phone: '+78460001001', note: '' },
  { id: 'SMR002', name: 'CDEK', city: 'Самара',          address: 'ул. Московское ш., 17',   latitude: 53.2211, longitude: 50.1650, workTime: 'Пн-Пт 10:00-20:00, Сб-Вс 10:00-19:00', phone: '+78460001002', note: '' },
  { id: 'SMR003', name: 'CDEK', city: 'Самара',          address: 'ул. Стара-Загора, 141',   latitude: 53.2150, longitude: 50.2050, workTime: 'Пн-Пт 09:00-21:00, Сб-Вс 10:00-19:00', phone: '+78460001003', note: '' },
  { id: 'SAM19',  name: 'CDEK', city: 'Самара',          address: 'пр-кт Масленникова, 14',  latitude: 53.2105, longitude: 50.1800, workTime: 'Пн-Пт 10:00-21:00, Сб-Вс 10:00-20:00', phone: '+79270049083', note: 'Здание на пересечении пр-та Масленникова и ул. Мичурина, вход с ул. Мичурина' },
  { id: 'KZN001', name: 'CDEK', city: 'Казань',           address: 'ул. Баумана, 82',         latitude: 55.7887, longitude: 49.1221, workTime: 'Пн-Пт 09:00-20:00, Сб-Вс 10:00-19:00', phone: '+78430001001', note: '' },
  { id: 'KZN002', name: 'CDEK', city: 'Казань',           address: 'ул. Пушкина, 12',         latitude: 55.7960, longitude: 49.1080, workTime: 'Пн-Пт 09:00-21:00, Сб-Вс 10:00-20:00', phone: '+78430001002', note: '' },
  { id: 'EKB001', name: 'CDEK', city: 'Екатеринбург',    address: 'ул. 8 Марта, 46',         latitude: 56.8309, longitude: 60.6057, workTime: 'Пн-Пт 09:00-21:00, Сб-Вс 10:00-20:00', phone: '+73430001001', note: '' },
  { id: 'EKB002', name: 'CDEK', city: 'Екатеринбург',    address: 'ул. Ленина, 50',          latitude: 56.8380, longitude: 60.6030, workTime: 'Пн-Пт 10:00-20:00, Сб-Вс 10:00-19:00', phone: '+73430001002', note: '' },
  { id: 'NSK001', name: 'CDEK', city: 'Новосибирск',     address: 'ул. Ленина, 12',          latitude: 55.0302, longitude: 82.9204, workTime: 'Пн-Пт 09:00-20:00, Сб-Вс 10:00-19:00', phone: '+73830001001', note: '' },
  { id: 'NSK002', name: 'CDEK', city: 'Новосибирск',     address: 'Красный пр-т, 63',        latitude: 55.0410, longitude: 82.9150, workTime: 'Пн-Пт 09:00-21:00, Сб-Вс 10:00-20:00', phone: '+73830001002', note: '' },
  { id: 'NNV001', name: 'CDEK', city: 'Нижний Новгород',  address: 'ул. Большая Покровка, 28', latitude: 56.2965, longitude: 43.9361, workTime: 'Пн-Пт 09:00-21:00, Сб-Вс 10:00-20:00', phone: '+78310001001', note: '' },
  { id: 'NNV002', name: 'CDEK', city: 'Нижний Новгород',  address: 'ул. Родионова, 165',      latitude: 56.3250, longitude: 44.0220, workTime: 'Пн-Пт 10:00-20:00, Сб-Вс 10:00-19:00', phone: '+78310001002', note: '' },
  { id: 'RND001', name: 'CDEK', city: 'Ростов-на-Дону',   address: 'ул. Большая Садовая, 34', latitude: 47.2225, longitude: 39.7183, workTime: 'Пн-Пт 09:00-21:00, Сб-Вс 10:00-20:00', phone: '+78630001001', note: '' },
  { id: 'RND002', name: 'CDEK', city: 'Ростов-на-Дону',   address: 'пр-т Буденновский, 80',   latitude: 47.2250, longitude: 39.7000, workTime: 'Пн-Пт 09:00-21:00, Сб-Вс 10:00-19:00', phone: '+78630001002', note: '' }
];

window.fetchMockCdekPoints = function({city, query} = {}){
  return new Promise((resolve, reject)=>{
    const delay = 380 + Math.random()*360;
    setTimeout(()=>{
      if(Math.random() < 0.05) return reject(new Error('Unable to load pickup points'));
      let list = window.MOCK_CDEK_PVZ.slice();
      if(city){
        const c = city.trim().toLowerCase();
        list = list.filter(p => p.city.toLowerCase() === c);
      }
      if(query){
        const q = query.trim().toLowerCase();
        if(q) list = list.filter(p => (p.address + ' ' + p.name + ' ' + p.id).toLowerCase().includes(q));
      }
      resolve(list);
    }, delay);
  });
};

window.fetchMockCities = function(query){
  return new Promise((resolve)=>{
    const delay = 160 + Math.random()*180;
    setTimeout(()=>{
      const q = (query||'').trim().toLowerCase();
      if(!q) return resolve([]);
      const list = window.MOCK_CITIES.filter(c => c.name.toLowerCase().includes(q));
      resolve(list);
    }, delay);
  });
};
