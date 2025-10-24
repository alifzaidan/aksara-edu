import{K as n,j as e,$ as d}from"./app-HO3nJoC_.js";import{T as m}from"./sonner-B0P6--1E.js";import{S as p,a as f,b as l,c,d as h,L as k,e as u,f as x,g as j,h as y,A as b,i as M}from"./breadcrumbs-geGw3YtV.js";import{N as S,A as g}from"./app-sidebar-header-CVXECRem.js";import{U as v}from"./user-B_ySam1j.js";import{U as A}from"./user-check-BeG41bjx.js";import{U as N}from"./users-3uUSzbrP.js";import{c as s}from"./createLucideIcon-l3PHHnp-.js";import{B as z,M as C}from"./monitor-play-D4-wzj3c.js";import{P}from"./presentation-bA3sBYn1.js";import{B as _}from"./banknote-CGxeAqGK.js";import{D as o}from"./dollar-sign-DLwYkJmA.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=[["path",{d:"M2 8h20",key:"d11cs7"}],["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"M6 16h12",key:"u522kt"}]],U=s("Dock",L);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=[["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M3 18h.01",key:"1tta3j"}],["path",{d:"M3 6h.01",key:"1rqtza"}],["path",{d:"M8 12h13",key:"1za7za"}],["path",{d:"M8 18h13",key:"1lx6n3"}],["path",{d:"M8 6h13",key:"ik3vkj"}]],B=s("List",w);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"M12 9v11",key:"1fnkrn"}],["path",{d:"M2 9h13a2 2 0 0 1 2 2v9",key:"11z3ex"}]],$=s("Proportions",D);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],T=s("ShieldCheck",K);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=[["path",{d:"M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z",key:"xwnzip"}],["path",{d:"M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6",key:"14rsvq"}]],I=s("SquareMousePointer",q);function G({items:r=[]}){const i=n();return e.jsxs(p,{className:"px-2 py-0",children:[e.jsx(f,{children:"Menu"}),e.jsx(l,{children:r.map(a=>{const t=a.href==="/"?i.url===a.href:i.url.startsWith(a.href);return e.jsx(c,{children:e.jsx(h,{asChild:!0,isActive:t,tooltip:{children:a.title},children:e.jsxs(d,{href:a.href,prefetch:!0,children:[a.icon&&e.jsx(a.icon,{}),e.jsx("span",{children:a.title})]})})},a.title)})})]})}const H=[{title:"Dashboard",href:"/admin/dashboard",icon:k,roles:["admin","mentor","affiliate"]},{title:"Pengguna",href:"/admin/users",icon:v,roles:["admin"]},{title:"Afiliasi",href:"/admin/affiliates",icon:A,roles:["admin"]},{title:"Mentor",href:"/admin/mentors",icon:N,roles:["admin"]},{title:"Kategori",href:"/admin/categories",icon:B,roles:["admin","mentor"]},{title:"Tools",href:"/admin/tools",icon:I,roles:["admin","mentor"]},{title:"Kelas Online",href:"/admin/courses",icon:z,roles:["admin","mentor","affiliate"]},{title:"Bootcamp",href:"/admin/bootcamps",icon:P,roles:["admin","affiliate"]},{title:"Webinar",href:"/admin/webinars",icon:C,roles:["admin","affiliate"]},{title:"Sertifikasi Kerjasama",href:"/admin/partnership-products",icon:T,roles:["admin"]},{title:"Sertifikat",href:"/admin/certificates",icon:U,roles:["admin"]},{title:"Kode Diskon",href:"/admin/discount-codes",icon:_,roles:["admin"]},{title:"Flyer Promosi",href:"/admin/promotions",icon:$,roles:["admin"]},{title:"Transaksi",href:"/admin/transactions",icon:o,roles:["admin"]},{title:"Pendapatan",href:"/admin/affiliate-earnings",icon:o,roles:["affiliate","mentor"]}];function F(){const{auth:r}=n().props,i=r.role[0],a=H.filter(t=>t.roles.includes(i));return e.jsxs(u,{collapsible:"icon",variant:"inset",children:[e.jsx(x,{children:e.jsx(l,{children:e.jsx(c,{children:e.jsx(h,{size:"lg",asChild:!0,children:e.jsxs(d,{href:"/admin/dashboard",prefetch:!0,children:[e.jsx("img",{src:"/assets/images/logo-primary.png",alt:"Aksademy",className:"block w-32 fill-current dark:hidden"}),e.jsx("img",{src:"/assets/images/logo-secondary.png",alt:"Aksademy",className:"hidden w-32 fill-current dark:block"})]})})})})}),e.jsx(j,{children:e.jsx(G,{items:a})}),e.jsx(y,{children:e.jsx(S,{})})]})}function V({children:r,breadcrumbs:i=[]}){return e.jsxs(b,{variant:"sidebar",children:[e.jsx(F,{}),e.jsxs(M,{variant:"sidebar",children:[e.jsx(g,{breadcrumbs:i}),r]})]})}const re=({children:r,breadcrumbs:i,...a})=>e.jsxs(V,{breadcrumbs:i,...a,children:[r,e.jsx(m,{position:"top-center",richColors:!0})]});export{re as A};
