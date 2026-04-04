const API_URL = "http://127.0.0.1:8000";
export const sendMessage= async(message,mood="neutral")=>{
    const res=await fetch(`${API_URL}/chat`,{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
        },
        body:JSON.stringify({message,mood})
    });
    return res.json();
}