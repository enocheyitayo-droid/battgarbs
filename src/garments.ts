export type Configuration={template:string;material:string;colour:string;sleeves:boolean;train:boolean;overskirt:boolean};
export const templates=[
 {id:'aurelia',name:'Aurelia · A-line',asset:'/models/aurelia.glb',parts:['Sleeves','Train','Overskirt']},
 {id:'celeste',name:'Celeste · lace column',asset:'/models/celeste.glb',parts:['Sleeves','Train']},
 {id:'rosalie',name:'Rosalie · ball gown',asset:'/models/rosalie.glb',parts:['Train','Overskirt']}
];
export const materials=[{id:'satin',name:'Ivory satin',roughness:.3,price:32,colour:'#eee4d6',description:'Smooth lustre · sample €32/m'}, {id:'lace',name:'Floral lace',roughness:.85,price:48,colour:'#f1ebe1',description:'Delicate overlay · sample €48/m'}, {id:'tulle',name:'Soft tulle',roughness:.9,price:18,colour:'#e9e0d5',description:'Airy layers · sample €18/m'}, {id:'organza',name:'Silk organza',roughness:.6,price:40,colour:'#f6f0e8',description:'Crisp structure · sample €40/m'}];
export const initialConfiguration:Configuration={template:'aurelia',material:'satin',colour:'#eee4d6',sleeves:true,train:true,overskirt:true};
export function secondLook(c:Configuration):Configuration{return {...c,train:false,overskirt:false};}
export function transformationCompatible(a:Configuration,b:Configuration){const t=templates.find(t=>t.id===a.template);return !!t&&a.template===b.template&&a.material===b.material&&a.colour===b.colour&&a.sleeves===b.sleeves&&(!b.train||a.train)&&(!b.overskirt||a.overskirt)&&((a.train&&!b.train&&t.parts.includes('Train'))||(a.overskirt&&!b.overskirt&&t.parts.includes('Overskirt')));}
