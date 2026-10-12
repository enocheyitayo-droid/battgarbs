import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import '../src/style.css';
export const metadata:Metadata={title:'BattGarbs — Your dress, your story',description:'Create a personal bridal gown, collaborate with the atelier and plan its next chapter.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:ReactNode}){return <html lang="en"><body>{children}</body></html>;}
