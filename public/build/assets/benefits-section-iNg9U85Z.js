import{j as e}from"./app-DhoyClN6.js";import{u as l}from"./useTranslation-BSj7m2K5.js";import{B as o}from"./badge-check-BDHBDg4y.js";import"./createLucideIcon-Dt0IaBre.js";function c(s){if(!s)return[];const i=String(s).trim();if(!i)return[];const r=i.match(/<li[^>]*>[\s\S]*?<\/li>/gi),n=i.replace(/<br\s*\/?\s*>/gi,`
`).replace(/<\/p>/gi,`
`).replace(/<\/div>/gi,`
`).replace(/<[^>]+>/g,"").replace(/\r\n?/g,`
`).split(`
`).map(t=>t.trim()).filter(Boolean).map(t=>t.replace(/^[-*•–—\u2022]+\s+/,"").trim()).filter(Boolean);return r!=null&&r.length?r.map(t=>t.replace(/<li[^>]*>/gi,"").replace(/<\/li>/gi,"").replace(/<br\s*\/?\s*>/gi,`
`).replace(/<[^>]+>/g,"").trim()).filter(Boolean):n}function x({webinar:s}){const{t:i}=l("user"),r=c(s.benefits);return e.jsx("section",{className:"mx-auto w-full max-w-5xl px-4",children:e.jsx("div",{className:"mt-6 w-full",children:e.jsxs("div",{children:[e.jsx("p",{className:"text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs",children:i("webinar.detail.benefitsGained")}),e.jsx("ul",{className:"space-y-2",children:r.map((a,n)=>e.jsxs("li",{className:"flex gap-2",children:[e.jsx(o,{className:"mt-1 min-w-12 text-green-600"}),e.jsx("div",{children:e.jsx("h4",{className:"text-lg font-semibold",children:a})})]},n))})]})})})}export{x as default};
