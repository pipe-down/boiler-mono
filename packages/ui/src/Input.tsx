import * as React from 'react';
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>){
  return <input {...props} style={{padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8, width:'100%'}} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>){
  return <textarea {...props} style={{padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8, width:'100%'}} />;
}
export function Checkbox({label, ...rest}:{label:string}&React.InputHTMLAttributes<HTMLInputElement>){
  return <label style={{display:'inline-flex', gap:8, alignItems:'center'}}><input type="checkbox" {...rest} />{label}</label>;
}
export function FormRow({label, children}:{label:string, children:React.ReactNode}){
  return <div style={{marginBottom:12}}><div style={{fontSize:12, opacity:.8, marginBottom:6}}>{label}</div>{children}</div>;
}
