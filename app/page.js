"use client";

import { useState, useEffect } from 'react';

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchState = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/game');
      const data = await res.json();
      setPlayers(data.players || []);
      setDebts(data.debts || []);
    } catch (e) {
      console.error(e);
    }
    if (showLoading) setLoading(false);
  };

  useEffect(() => {
    fetchState(true);
  }, []);

  // Auto-poll every 3 seconds so all browsers stay in sync
  useEffect(() => {
    const interval = setInterval(() => fetchState(false), 3000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all data?')) return;
    await fetch('/api/game', { method: 'DELETE' });
    await fetchState();
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Game Debt Tracker</h1>
        {players.length > 0 && (
          <button className="btn danger" onClick={handleReset}>Reset All</button>
        )}
      </div>
      
      {players.length === 0 ? (
        <SetupGame onSetupComplete={fetchState} />
      ) : (
        <div className="trees-grid">
          {players.map(player => (
            <PlayerTree 
              key={player.id} 
              player={player} 
              allPlayers={players} 
              debts={debts} 
              onDebtUpdated={fetchState} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SetupGame({ onSetupComplete }) {
  const [numPlayers, setNumPlayers] = useState(3);
  const [playerNames, setPlayerNames] = useState(['', '', '']);
  
  const handleNumChange = (e) => {
    const num = parseInt(e.target.value) || 0;
    setNumPlayers(num);
    setPlayerNames(Array(num).fill(''));
  };

  const handleNameChange = (index, value) => {
    const newNames = [...playerNames];
    newNames[index] = value;
    setPlayerNames(newNames);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (playerNames.some(name => !name.trim())) return alert('Please fill in all player names.');
    
    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ players: playerNames })
    });
    onSetupComplete();
  };

  return (
    <div className="glass-panel setup-form">
      <h2 style={{marginTop: 0}}>Setup New Game</h2>
      <div className="player-input-row">
        <label style={{minWidth: '140px'}}>Number of Players:</label>
        <input 
          type="number" 
          className="input-field" 
          value={numPlayers} 
          onChange={handleNumChange} 
          min="2" 
          max="10" 
        />
      </div>
      <form onSubmit={handleSubmit} className="player-inputs">
        {playerNames.map((name, i) => (
          <input
            key={i}
            className="input-field"
            placeholder={`Player ${i + 1} Name`}
            value={name}
            onChange={(e) => handleNameChange(i, e.target.value)}
          />
        ))}
        <button type="submit" className="btn">Start Game</button>
      </form>
    </div>
  );
}

function PlayerTree({ player, allPlayers, debts, onDebtUpdated }) {
  const otherPlayers = allPlayers.filter(p => p.id !== player.id);
  const leaves = [...otherPlayers, { id: 'BANK', name: 'Bank' }];

  return (
    <div className="glass-panel">
      <div className="tree-root">{player.name}</div>
      <div className="tree-leaves">
        {leaves.map(leaf => (
          <LeafNode 
            key={leaf.id} 
            rootId={player.id} 
            leaf={leaf} 
            debts={debts} 
            onDebtUpdated={onDebtUpdated} 
          />
        ))}
      </div>
    </div>
  );
}

function LeafNode({ rootId, leaf, debts, onDebtUpdated }) {
  const debtFromRoot = debts.find(d => d.fromId === rootId && d.toId === leaf.id)?.amount || 0;
  const debtFromLeaf = debts.find(d => d.fromId === leaf.id && d.toId === rootId)?.amount || 0;
  
  // amount leaf owes root
  const netLeafOwesRoot = debtFromLeaf - debtFromRoot;
  
  const [sign, setSign] = useState('+');
  const [amount, setAmount] = useState('');

  const handleTransaction = async () => {
    const val = parseInt(amount);
    if (!val || val <= 0) return;
    
    const delta = sign === '+' ? val : -val;

    await fetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromId: leaf.id,
        toId: rootId,
        delta
      })
    });
    setAmount('');
    onDebtUpdated();
  };

  let debtText = 'No debt';
  let debtClass = 'neutral';
  if (netLeafOwesRoot > 0) {
    debtText = `Owes ${netLeafOwesRoot}`;
    debtClass = 'positive';
  } else if (netLeafOwesRoot < 0) {
    debtText = `You owe ${-netLeafOwesRoot}`;
    debtClass = 'negative';
  }

  return (
    <div className="leaf-node">
      <div className="leaf-header">
        <span>{leaf.name}</span>
        <span className={`debt-amount ${debtClass}`}>{debtText}</span>
      </div>
      <div className="debt-controller">
        <div className="radio-group">
          <input 
            type="radio" 
            id={`plus-${rootId}-${leaf.id}`} 
            className="radio-input" 
            name={`sign-${rootId}-${leaf.id}`} 
            checked={sign === '+'} 
            onChange={() => setSign('+')}
          />
          <label htmlFor={`plus-${rootId}-${leaf.id}`} className="radio-label plus">+</label>
          
          <input 
            type="radio" 
            id={`minus-${rootId}-${leaf.id}`} 
            className="radio-input" 
            name={`sign-${rootId}-${leaf.id}`} 
            checked={sign === '-'} 
            onChange={() => setSign('-')}
          />
          <label htmlFor={`minus-${rootId}-${leaf.id}`} className="radio-label minus">-</label>
        </div>
        <input 
          type="number" 
          className="input-field debt-input" 
          placeholder="Amount" 
          value={amount} 
          onChange={e => setAmount(e.target.value)}
        />
        <button className="btn icon-btn" onClick={handleTransaction}>Go</button>
      </div>
    </div>
  );
}
