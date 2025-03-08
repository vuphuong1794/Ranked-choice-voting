import React, { useState } from 'react';
import CountSelector from '../components/ui/CountSelector';
import { actions } from '../state';

const Create: React.FC = () => {
  const [pollTopic, setPollTopic] = useState('');
  const [maxVotes, setMaxVotes] = useState(3);
  const [name, setName] = useState('');
  
  const areFieldsValid = (): boolean => {
    if (pollTopic.length < 1 || pollTopic.length > 100) {   
      return false;
    }
    if (maxVotes < 1 || maxVotes > 5) {
      return false;
    }
    if (name.length < 1 || name.length > 25) {
      return false;
    }
    return true
  }
  
  return (
    <div className="flex  flex-col w-full justify-around items-stretch h-full mx-auto max-w-sm">
      <div className="mb-12">
        <h3 className="text-center">Enter Poll Topic</h3>
        <div className="text-center w-full">
            <input maxLength={100} onChange={(e)=>setPollTopic(e.target.value)} className="box info w-full" />
        </div>
        <h3 className="text-center mt-4 mb-2">Votes Per Participant</h3>
        <div className="w-48 mx-auto my-4">
            <CountSelector min={1} max={5} step={1} initial={3} onChange={(val)=>setMaxVotes(val)}/>
        </div>
        <div className="mb-12">
            <h3 className="text-center">Enter name</h3>
            <div className="text-center w-full">
                <input maxLength={25} onChange={(e)=>setName(e.target.value)} className="box info w-full" />
            </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center">
        <button className="box btn-orange w-32 my-2" onClick={()=>console.log('create poll')} disabled={!areFieldsValid()}>Create</button>
        <button className="box btn-purple w-32 my-2" onClick={()=> actions.startOver()}>
            Start Over
        </button>
      </div>
    </div>
  );
};

export default Create;
