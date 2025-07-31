import { Button } from '@mui/material'
import React from 'react'
import { Link } from 'react-router-dom'

const Sobre = () => {
  return (
    <>

        <div className='flex justify-center mb-2'>
            <h1 className='text-white'>Page em processo de criação.</h1>
        </div>
        <div className='flex justify-center mb-2'>
            <h2 className='text-white'>👇Volte para a página principal no botão abaixo👇</h2>
        </div>
        <div className='flex justify-center'>
              <Link to={"/"}><Button variant='contained' sx={{ bgcolor: "black" }}>Pagina principal</Button></Link>
        </div>
    </>
  )
}

export default Sobre