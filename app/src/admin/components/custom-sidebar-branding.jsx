import React from 'react'
import styled from 'styled-components'

const Brand = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 20px 14px;
  text-decoration: none;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  margin-bottom: 4px;
  transition: opacity 150ms ease;

  &:hover { opacity: 0.8; }
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

const Name = styled.span`
  color: #ebebeb;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.2px;
`

const CustomSidebarBranding = () => (
  <Brand href="/admin">
    <Mark>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3h14l-7 9z"/>
        <line x1="12" y1="12" x2="12" y2="21"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
      </svg>
    </Mark>
    <Name>Bar</Name>
  </Brand>
)

export default CustomSidebarBranding
