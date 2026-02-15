import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

import { io } from 'socket.io-client';
const socket = io("https://chess-game-backend-sigma.vercel.app/");

import { Chess } from 'chess.js';
const chess = new Chess();

const App = () => {
  
  const [message, setMessage] = useState("");
  const [board, setBoard] = useState(chess.board());
  const [playerRole, setPlayerRole] = useState(null);

  const sourceSquare = useRef(null);
  const dragPiece = useRef(false);

  const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    };
    console.log("Attempting move:", move); // Check your browser console!
    socket.emit("move", move);
} ;

 const getPieceUnicode = (piece) => {
    const symbols = {
        p: '♙', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
        P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔',
    };
    return symbols[piece.type] || "";
};
  
  useEffect(() => {
    
    socket.on('boardState', (fen) => {
        chess.load(fen);
        setBoard(chess.board());
    });

    socket.on('move', (move) => {
        
    });

    socket.on('playerRole', (role) => {
        setPlayerRole(role);
    });

    socket.on('spectatorRole', () => {
        setPlayerRole(null);
    });

    socket.emit("send_message", { text: message });
    setMessage("");

    return () => {
      socket.off('receive_message');
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-zinc-900 flex justify-center items-center">
      <div className={`chessboard w-[500px] h-[500px] grid grid-cols-8 grid-rows-8 border-4 border-zinc-800 transition-transform duration-500 ${playerRole === 'b' ? 'flipped' : '' }`}>
        {board.map((row, rowIdx) =>
          row.map((square, squareIdx) => {
            // Logic for alternating colors
            const isDark = (rowIdx + squareIdx) % 2 !== 0;
            const currentBGC = isDark ? 'bg-zinc-700' : 'bg-zinc-200';

            // inside your row.map -> square.map
return (
  <div
    key={`${rowIdx}-${squareIdx}`}
    className={`w-full h-full ${currentBGC} flex items-center justify-center`}
    onDragOver={(e) => e.preventDefault()}
    onDragEnter={(e) => e.preventDefault()} // CRITICAL: Allows dropping
    onDrop={(e) => {
      e.preventDefault();
      if (dragPiece.current) {
        const targetSource = { row: rowIdx, col: squareIdx };
        
        // Fix: Use .current when passing sourceSquare
        handleMove(sourceSquare.current, targetSource);
      }
    }}
  >
    {square && (
      <div
        className={`piece  ${playerRole === 'b' ? 'flipped' : '' } ${square.color === 'w' ? 'text-white' : 'text-black'} text-5xl cursor-grab` }
        draggable={playerRole === square.color} // Enabled only for your turn/color
        onDragStart={(e) => {
          // Fix: Use .current to store the data
          dragPiece.current = true;
          sourceSquare.current = { row: rowIdx, col: squareIdx };
          
          // Required for some browsers to initiate drag
          e.dataTransfer.setData("text/plain", "");
        }}
        onDragEnd={() => {
          // Fix: Clean up using .current
          dragPiece.current = false;
          sourceSquare.current = null;
        }}
      >
        {getPieceUnicode(square)}
      </div>
    )}
  </div>
);
          })
        )}
      </div>
    </div>
  );
}

export default App