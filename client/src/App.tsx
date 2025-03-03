import React from 'react';
import Pages from './Pages';
import './index.css';
import { devtools } from 'valtio/utils'
import { state } from './state';

//valtio:  thư viện quản lý state 
devtools(state, 'app state');   //theo dõi state trong React Developer Tools
const App: React.FC = () => <Pages />;

export default App;
