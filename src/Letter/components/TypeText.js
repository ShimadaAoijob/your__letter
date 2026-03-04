import {useEffect,useState} from "react";
function TypeText ({text,speed = 50,className = ""}){
    const [display,setDisplay] = useState("")
    useEffect(()=>{
        let i = 0;
        setDisplay("");
        const timer = setInterval(()=>{
             if (i >= text.length){
                clearInterval(timer);
                return;
            }
            i += 1;
            setDisplay(text.slice(0,i));

           
        },speed);
        return ()=>clearInterval(timer);
    },[text,speed]);
    return<div className = {className}>{display}</div>
}
export default TypeText