// frontend/src/components/SideBar.jsx (ou .tsx)

import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, MenuItem } from '@mui/material';
import { MenuRounded, HomeRounded, InfoRounded } from '@mui/icons-material';

const SideBar = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path: string) => {
    handleClose();
    // A navegação real será feita pelo `Link`
  };

  return (
    // Sidebar: Fundo COMPLETAMENTE PRETO
    // Removido o 'relative' daqui, ele deve ir para o item do botão.
    <div className='fixed inset-y-0 left-0 z-50 w-12 h-full bg-black
                    flex flex-col items-center py-4
                    md:w-16 md:flex-shrink-0'>

      {/* Item da Sidebar para o Botão de Menu */}
      {/* ESTE DIV PRECISA SER RELATIVE E CONTÉM O INDICADOR AZUL */}
      <div className={`
                       relative // <-- Mude 'relative' para AQUI
                       w-full h-10 md:h-12 // Ocupa a largura total da sidebar
                       flex items-center justify-center
                       cursor-pointer
                       text-gray-400 hover:text-white
                       transition-colors duration-200
                       ${open ? 'bg-gray-800' : 'bg-black'} // Fundo para estado ativo/inativo
                       `}>

        {/* Barra Azul Lateral */}
        {/* Agora ela se posiciona absolutamente em relação a este div pai */}
        {open && (
          <div className="absolute left-0 top-0 h-full w-0.5 bg-blue-500"></div>
        )}

        {/* Ícone do Menu (clicável para abrir/fechar) */}
        <MenuRounded
          id='menu-button'
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? true : undefined}
          onClick={handleClick}
          className='text-xl'
          style={{ cursor: 'pointer' }}
        />
      </div>

      {/* Componente Menu do Material-UI (o conteúdo do menu) */}
      <Menu
        id='basic-menu'
        MenuListProps={{
          'aria-labelledby': 'menu-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          className: '!bg-gray-800 !text-white !rounded-md !shadow-lg'
        }}
      >
        <MenuItem
          onClick={() => handleMenuItemClick('/')}
          className='!text-white hover:!bg-gray-700 px-4 py-2 flex items-center gap-2'
          component={Link}
          to="/"
        >
          <HomeRounded fontSize="small" />
          Menu Inicial
        </MenuItem>

        <MenuItem
          onClick={() => handleMenuItemClick('/sobre')}
          className='!text-white hover:!bg-gray-700 px-4 py-2 flex items-center gap-2'
          component={Link}
          to="/sobre"
        >
          <InfoRounded fontSize="small" />
          Sobre
        </MenuItem>

      </Menu>
    </div>
  );
};

export default SideBar;