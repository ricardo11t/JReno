import { Route, Routes } from 'react-router-dom';
import RenomearArquivos from './pages/RenomearArquivos';

function App() {
  return (
    <Routes>
      <Route path='/' element={<RenomearArquivos />}/>
    </Routes>
  );
}

export default App;