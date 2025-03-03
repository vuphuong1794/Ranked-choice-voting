import React from 'react';
import { actions, AppPage } from '../state';

const Welcome: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center h-full">
      <h1 className="text-center my-12">Welcome to Ranker</h1>
      <button onClick={()=>actions.setPage(AppPage.Create)} className="box btn-orange my-2">
        Create New Poll
      </button>

      <button onClick={()=>actions.setPage(AppPage.Join)} className="box btn-purple my-2"> 
        Join Existing Poll
      </button>
    </div>
  );
};

export default Welcome;
