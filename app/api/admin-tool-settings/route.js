import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAdminRequest } from '../../../lib/adminAuth';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';
import { TOOL_CATALOG, defaultQuantities, validateToolQuantities } from '../../../lib/toolCatalog.mjs';
const headers={'Cache-Control':'no-store'};
export async function GET(request){
 if(!(await isAdminRequest(request)))return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 const {data,error}=await createAdminSupabaseClient().from('tool_settings').select('tool_key,quantities,updated_at');
 if(error)return NextResponse.json({error:'Unable to load tool settings.'},{status:500,headers});
 return NextResponse.json({tools:Object.entries(TOOL_CATALOG).map(([key,tool])=>({...tool,key,quantities:{...defaultQuantities(key),...data?.find(r=>r.tool_key===key)?.quantities}}))},{headers});
}
export async function PUT(request){
 if(!(await isAdminRequest(request)))return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 let body;try{body=await request.json();}catch{return NextResponse.json({error:'Invalid request.'},{status:400,headers});}
 const {quantities,error}=validateToolQuantities(body?.tool,body?.quantities);
 if(error)return NextResponse.json({error},{status:400,headers});
 const {error:saveError}=await createAdminSupabaseClient().from('tool_settings').upsert({tool_key:body.tool,quantities,updated_at:new Date().toISOString()},{onConflict:'tool_key'});
 if(saveError)return NextResponse.json({error:'Unable to save tool settings.'},{status:500,headers});
 revalidatePath(`/tools/${body.tool}`);
 return NextResponse.json({ok:true,quantities},{headers});
}
