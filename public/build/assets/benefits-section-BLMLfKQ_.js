import{j as e}from"./app-0TuvsvXq.js";import{B as s}from"./badge-check-DVX4p9_J.js";import"./createLucideIcon-CqpzSx-e.js";function c(t){if(!t)return[];const i=String(t).trim();if(!i)return[];const r=i.match(/<li[^>]*>[\s\S]*?<\/li>/gi),l=i.replace(/<br\s*\/?\s*>/gi,`
`).replace(/<\/p>/gi,`
`).replace(/<\/div>/gi,`
`).replace(/<[^>]+>/g,"").replace(/\r\n?/g,`
`).split(`
`).map(a=>a.trim()).filter(Boolean).map(a=>a.replace(/^[-*•–—\u2022]+\s+/,"").trim()).filter(Boolean);return r!=null&&r.length?r.map(a=>a.replace(/<li[^>]*>/gi,"").replace(/<\/li>/gi,"").replace(/<br\s*\/?\s*>/gi,`
`).replace(/<[^>]+>/g,"").trim()).filter(Boolean):l}function d({webinar:t}){const i=c(t.benefits);return e.jsx("section",{className:"mx-auto w-full max-w-5xl px-4",children:e.jsx("div",{className:"mt-6 w-full",children:e.jsxs("div",{children:[e.jsx("p",{className:"text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs",children:"Manfaat yang Didapatkan"}),e.jsx("ul",{className:"space-y-2",children:i.map((r,n)=>e.jsxs("li",{className:"flex gap-2",children:[e.jsx(s,{className:"mt-1 min-w-12 text-green-600"}),e.jsx("div",{children:e.jsx("h4",{className:"text-lg font-semibold",children:r})})]},n))})]})})})}export{d as default};
