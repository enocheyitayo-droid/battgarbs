import type {GarmentConfig} from './ThreeStudio';
export type Version={garment?:GarmentConfig;image:string;changes:string;detachable:boolean};
export type Design={name:string;original:string;versions:Version[];index:number;purpose:string};
export type Brief={id:string;name:string;email:string;budget:string;event:string;country:string;notes:string;design:Design;status:string;quote:string;consultation:string;sewing:string;fitting:string};
export function appendVersion(design:Design,version:Version):Design {const versions=[...design.versions.slice(0,design.index+1),version];return {...design,versions,index:versions.length-1};}
export function currentVersion(design:Design) {return design.versions[design.index];}
export function snapshotDesign(design:Design):Design {return {...design,versions:design.versions.slice(0,design.index+1).map(v=>({...v}))};}
