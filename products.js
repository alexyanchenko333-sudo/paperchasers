/* PaperChasers — product catalog data.
   Single source of truth, shared by the catalog grid and every product-N.html page. */
const PRODUCTS = [
  {
    id: 1,
    slug: "statue-waffle-longsleeve",
    name: "Statue Waffle Longsleeve",
    cat: "Tops",
    price: 6900,
    sizes: ["S","M","L","XL"],
    badge: "NEW DROP",
    img: "images/longsleeve.jpg",
    desc: "Waffle-knit longsleeve with a weathered monument print across the chest and script running down both sleeves. Heavyweight cotton, built for grind season."
  },
  {
    id: 2,
    slug: "receipt-zip-hoodie",
    name: "DON QUIJOTE HOODIE",
    cat: "Tops",
    price: 9900,
    sizes: ["S","M","L","XL"],
    img: "images/chasetee.jpg",
    desc: "Heavy zip-up hoodie with full receipt print down the back — every piece you've ever copped, tallied up. Premium fleece, oversized fit."
  }
];

/* Lookbook config — real photoshoot images.
   size: big (size-lg, 340x450) and small (size-md, 280x360) alternate.
   Both are portrait 3:4, matching all lookbook shots — no square crop. */
const LOOKBOOK_IMAGES = [
  { src: "images/lookbook1.jpeg", alt: "Look 1 - PaperChasers", size: "size-lg" },
  { src: "images/lookbook2.jpeg", alt: "Look 2 - PaperChasers", size: "size-md" },
  { src: "images/lookbook3.jpeg", alt: "Look 3 - PaperChasers", size: "size-lg" },
  { src: "images/lookbook4.jpeg", alt: "Look 4 - PaperChasers", size: "size-md" }
];
