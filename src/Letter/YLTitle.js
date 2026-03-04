import "./YLTitle.css"
import TypeText from "./components/TypeText"
function YLTitle({onStart}){
    const text = "Your Letter";
    return (
        <div className = "background" onClick = {onStart}>
            <div className = "title fade-in">
                <TypeText  text = {text} speed = {200}></TypeText>
            </div>
            <p className = "start fade-in delay-1"> Tap to start</p>
        </div> 
    )
    
}
export default YLTitle;
