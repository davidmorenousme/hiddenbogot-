import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { Proveedor } from './ctx.jsx';
import './styles.css';

// Google Translate cambia el DOM por su cuenta; esto evita errores conocidos de React
const quitar = Node.prototype.removeChild;
Node.prototype.removeChild = function (hijo) { return hijo.parentNode !== this ? hijo : quitar.apply(this, arguments); };
const insertar = Node.prototype.insertBefore;
Node.prototype.insertBefore = function (nuevo, ref) { return ref && ref.parentNode !== this ? nuevo : insertar.apply(this, arguments); };

createRoot(document.getElementById('root')).render(
  <BrowserRouter><Proveedor><App /></Proveedor></BrowserRouter>
);