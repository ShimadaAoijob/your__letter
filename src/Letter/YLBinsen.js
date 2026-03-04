import "./YLBinsen.css";
import { useState } from "react";
import b1 from "./2438464.jpg";
import b2 from "./22739902.jpg";
import b3 from "./25979319.jpg";
import b4 from "./26915392.jpg";
import b5 from "./26963109.jpg";
import b6 from "./26983527.jpg";

function YLBinsen({ goto, onDecide }) {
  const Binsen_list = [
    { id: "no1", img: b1 },
    { id: "no2", img: b2 },
    { id: "no3", img: b3 },
    { id: "no4", img: b4 },
    { id: "no5", img: b5 },
    { id: "no6", img: b6 },
  ];

  const [selectedId, setSelectedId] = useState(Binsen_list[0].id);

  return (
    <div className="binsen-background">
      <h1 className="binsen">びんせんをえらぶ</h1>


      <div className="binsenGrid">
        {Binsen_list.map((b) => (
          <div
            className="binsenCard"
            key={b.id}
            onClick={() => setSelectedId(b.id)}
          >
            <img className="binsenImg" src={b.img} alt={b.id} />

            <button
              className="decide"
              onClick={(e) => {
                e.stopPropagation(); 
                onDecide(b.img);
              }}
            >
              決定
            </button>
          </div>
        ))}
        <button className="goto" onClick={goto}>戻る</button>
      </div>
    </div>
  );
}

export default YLBinsen;