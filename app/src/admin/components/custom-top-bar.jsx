import React from 'react'
import styled from 'styled-components'
import { useSelector } from 'react-redux'

const Bar = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 64px;
  z-index: 9999;
  background: rgba(8,8,8,0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const Logo = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: #ebebeb;
  text-decoration: none;
  margin-right: 24px;
  flex-shrink: 0;
  &:hover { opacity: 0.8; }
  /* Sidebar already shows the brand at wide viewports — hide duplicate */
  @media (min-width: 1024px) { display: none; }
`

const Mark = styled.div`
  width: 26px;
  height: 26px;
  background: #a259ff;
  border-radius: 6px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
`

const NavLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: 2px;
  @media (max-width: 768px) { display: none; }
`

const NavBtn = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  color: #888;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-weight: 450;
  letter-spacing: -0.1px;
  transition: color 150ms ease, background 150ms ease;
  &:hover { color: #ebebeb; background: #1e1e1e; }
`

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const BtnOutline = styled.a`
  font-size: 13.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 6px;
  transition: all 150ms ease;
  white-space: nowrap;
  text-decoration: none;
  color: #888;
  border: 1px solid rgba(255,255,255,0.07);
  background: transparent;
  &:hover { color: #ebebeb; border-color: rgba(255,255,255,0.13); background: #1e1e1e; }
`

const BtnSolid = styled.button`
  font-size: 13.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 6px;
  transition: all 150ms ease;
  white-space: nowrap;
  color: #ebebeb;
  border: 1px solid rgba(255,255,255,0.13);
  background: transparent;
  &:hover { background: #1e1e1e; }
`

const CustomTopBar = (props) => {
  const { toggleSidebar } = props
  const paths = useSelector((state) => state.paths)

  const go = (id) => { window.location.href = `/admin/resources/${id}` }
  const logout = () => { window.location.href = paths?.logoutPath || '/admin/logout' }

  return (
    <Bar>
      <Left>
        <Logo href="/admin">
          <Mark>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3h14l-7 9z"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
            </svg>
          </Mark>
          Bar
        </Logo>

        <NavLinks>
          <NavBtn onClick={() => go('Bebida')}>Bebidas</NavBtn>
          <NavBtn onClick={() => go('Barra')}>Barras</NavBtn>
          <NavBtn onClick={() => go('Venta')}>Ventas</NavBtn>
          <NavBtn onClick={() => go('DetalleVenta')}>Detalle</NavBtn>
        </NavLinks>
      </Left>

      <Right>
        <BtnOutline href="/">← Inicio</BtnOutline>
        <BtnSolid onClick={logout}>Salir</BtnSolid>
      </Right>
    </Bar>
  )
}

export default CustomTopBar
