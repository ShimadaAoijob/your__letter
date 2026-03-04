import "./YLIndex.css";
import {useState} from "react"
function YLIndex ({gotitle,gowrite,gosee,gosettings}){
    return(
        <div className = "index-background">
            <h1 className = "WhatToDo">ごきげんよう</h1>
            <button className = "ToWrite"  onClick = {gowrite}> 手紙を書く</button>
            <button className = "ToSee" onClick = {gosee}>手紙を見る</button>
            <button className = "ToSettings" onClick = {gosettings}>音量設定</button>
            <button className = "ForTitle" onClick = {gotitle}>タイトルに戻る</button>
        </div>
    )
}

export default YLIndex