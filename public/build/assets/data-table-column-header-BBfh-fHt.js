import{j as e}from"./app-Dq6gQsdJ.js";import{c as n}from"./utils-DDsyvClK.js";import{B as c}from"./button-DQNQt15p.js";import{D as p,a as h,b as x,c as o,d as l}from"./dropdown-menu-CU6qixXW.js";import{c as r}from"./createLucideIcon-_HNCqxDG.js";import{C as j}from"./chevrons-up-down-BGAXYzSt.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"m19 12-7 7-7-7",key:"1idqje"}]],i=r("ArrowDown",m);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]],d=r("ArrowUp",g);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],w=r("EyeOff",f);function v({column:s,title:t,className:a}){return s.getCanSort()?e.jsx("div",{className:n("flex items-center gap-2",a),children:e.jsxs(p,{children:[e.jsx(h,{asChild:!0,children:e.jsxs(c,{variant:"ghost",size:"sm",className:"data-[state=open]:bg-accent -ml-3 h-8",children:[e.jsx("span",{children:t}),s.getIsSorted()==="desc"?e.jsx(i,{}):s.getIsSorted()==="asc"?e.jsx(d,{}):e.jsx(j,{})]})}),e.jsxs(x,{align:"start",children:[e.jsxs(o,{onClick:()=>s.toggleSorting(!1),children:[e.jsx(d,{}),"Asc"]}),e.jsxs(o,{onClick:()=>s.toggleSorting(!0),children:[e.jsx(i,{}),"Desc"]}),e.jsx(l,{}),e.jsxs(o,{onClick:()=>s.toggleVisibility(!1),children:[e.jsx(w,{}),"Hide"]})]})]})}):e.jsx("div",{className:n(a),children:t})}export{v as D};
