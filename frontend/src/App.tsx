import { Route, Routes } from 'react-router-dom';
import RenomearArquivos from './pages/RenomearArquivos';
import Sobre from './pages/Sobre';

function App() {
  return (
    <Routes>
      <Route path='/' element={<RenomearArquivos />}/>
      <Route path='/sobre' element={<Sobre />} />
    </Routes>
  );
}

export default App;