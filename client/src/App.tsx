import React from 'react';
import Pages from './Pages';

import './index.css';
import { devtools } from 'valtio/utils'
import { state } from './state';
import { useSnapshot } from 'valtio';
import Loader from './components/ui/Loader';

//valtio:  thư viện quản lý state 
devtools(state, 'app state');   //theo dõi state trong React Developer Tools
const App: React.FC = () => {
    const currentState = useSnapshot(state);

    return (
        <>
            <Loader isLoading={currentState.isLoading} color='orange' width={120}/>
            <Pages/>
        </>
    )
};

export default App;
