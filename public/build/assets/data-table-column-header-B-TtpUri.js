import{j as s}from"./app-CYQN4a4X.js";import{c as n}from"./utils-6Y1eaNKd.js";import{B as c}from"./button-DwibgsmD.js";import{D as p,a as l,b as x,c as r,d as j}from"./dropdown-menu-W4Rv1w5Q.js";import{c as d}from"./createLucideIcon-Cs9SzV9d.js";import{C as m}from"./chevrons-up-down-BIqNx0ct.js";import{E as h}from"./eye-off-CwEAiXhZ.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=[["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"m19 12-7 7-7-7",key:"1idqje"}]],a=d("ArrowDown",g);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]],i=d("ArrowUp",f);function y({column:e,title:o,className:t}){return e.getCanSort()?s.jsx("div",{className:n("flex items-center gap-2",t),children:s.jsxs(p,{children:[s.jsx(l,{asChild:!0,children:s.jsxs(c,{variant:"ghost",size:"sm",className:"data-[state=open]:bg-accent -ml-3 h-8",children:[s.jsx("span",{children:o}),e.getIsSorted()==="desc"?s.jsx(a,{}):e.getIsSorted()==="asc"?s.jsx(i,{}):s.jsx(m,{})]})}),s.jsxs(x,{align:"start",children:[s.jsxs(r,{onClick:()=>e.toggleSorting(!1),children:[s.jsx(i,{}),"Asc"]}),s.jsxs(r,{onClick:()=>e.toggleSorting(!0),children:[s.jsx(a,{}),"Desc"]}),s.jsx(j,{}),s.jsxs(r,{onClick:()=>e.toggleVisibility(!1),children:[s.jsx(h,{}),"Hide"]})]})]})}):s.jsx("div",{className:n(t),children:o})}export{y as D};
