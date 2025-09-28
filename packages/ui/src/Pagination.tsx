import * as React from 'react';
type Props = { page:number; pageSize:number; total:number; onChange:(p:number)=>void };
export function Pagination({page,pageSize,total,onChange}:Props){
  const pages = Math.max(1, Math.ceil(total/pageSize));
  return (
    <div style={{display:'flex',gap:8,alignItems:'center'}}>
      <button disabled={page<=1} onClick={()=>onChange(page-1)}>Prev</button>
      <span>{page} / {pages}</span>
      <button disabled={page>=pages} onClick={()=>onChange(page+1)}>Next</button>
    </div>
  );
}
