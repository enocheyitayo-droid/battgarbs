'use client';
import dynamic from 'next/dynamic';
const Atelier=dynamic(()=>import('../src/main'),{ssr:false,loading:()=> <p className="p-8 text-center">Opening the BattGarbs atelier…</p>});
export default function Page(){return <Atelier/>;}
