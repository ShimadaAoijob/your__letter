import "./YLTo.css";


function YLTo ({goindex,onDecide}){
    return(
        <div className = "write-background">
            <h1 className = "ForWhom">あてさき</h1>
            <button className = "ForPast"  onClick= {()=>onDecide("past")}> 過去の自分</button>
            <button className = "ForFuture" onClick = {()=>onDecide("future")}>未来の自分</button>
            <button className = "ForSomeone" onClick = {()=>onDecide("someone")}>どこかのだれか</button>
            <button className = "ToIndex" onClick = {goindex}>前画面へ戻る</button>
        </div>
    )
}

export default YLTo;