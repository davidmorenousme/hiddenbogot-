-- OJO: borra la base anterior y la crea de nuevo (solo tenía datos de ejemplo)
DROP DATABASE IF EXISTS hiddenbogota;
CREATE DATABASE hiddenbogota CHARACTER SET utf8mb4;
USE hiddenbogota;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  rol ENUM('turista','comercio','admin') DEFAULT 'turista',
  codigo VARCHAR(10) UNIQUE,          -- código para invitar amigos
  referido_por INT NULL,              -- id de quien lo invitó
  creado DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE comercios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,                -- dueño del negocio
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(200) NOT NULL,
  categoria VARCHAR(40) NOT NULL,
  descripcion TEXT,
  descripcion_en TEXT,
  horario VARCHAR(80) DEFAULT 'Lun - Dom · 8:00 a. m. - 8:00 p. m.',
  estado ENUM('borrador','pendiente','publicado') DEFAULT 'borrador',
  visitas INT DEFAULT 0,
  clics INT DEFAULT 0,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
CREATE TABLE resenas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comercio_id INT NOT NULL,
  usuario_id INT NULL,
  autor VARCHAR(80) NOT NULL,
  estrellas TINYINT NOT NULL,
  texto TEXT NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (comercio_id, usuario_id),   -- una reseña por usuario y comercio
  FOREIGN KEY (comercio_id) REFERENCES comercios(id) ON DELETE CASCADE
);
CREATE TABLE favoritos (
  usuario_id INT NOT NULL,
  comercio_id INT NOT NULL,
  PRIMARY KEY (usuario_id, comercio_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (comercio_id) REFERENCES comercios(id) ON DELETE CASCADE
);
CREATE TABLE fotos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comercio_id INT NOT NULL,
  archivo VARCHAR(200) NOT NULL,
  FOREIGN KEY (comercio_id) REFERENCES comercios(id) ON DELETE CASCADE
);
USE hiddenbogota;

CREATE TABLE IF NOT EXISTS pagos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  referencia VARCHAR(80) NOT NULL UNIQUE,
  preferencia_mp VARCHAR(100) NULL,
  pago_mp VARCHAR(100) NULL UNIQUE,
  monto DECIMAL(12,2) NOT NULL,
  moneda CHAR(3) NOT NULL DEFAULT 'COP',
  estado VARCHAR(30) NOT NULL DEFAULT 'pending',
  creado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  pagado_en DATETIME NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS afiliaciones (
  id INT NOT NULL AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  mp_subscription_id VARCHAR(100) NOT NULL,
  referencia VARCHAR(100) NOT NULL,
  monto DECIMAL(10,2) NOT NULL DEFAULT 80000,
  moneda VARCHAR(3) NOT NULL DEFAULT 'COP',
  estado VARCHAR(30) NOT NULL DEFAULT 'pending',
  siguiente_pago DATETIME NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_afiliaciones_mp (mp_subscription_id),
  KEY ix_afiliaciones_usuario (usuario_id),
  CONSTRAINT fk_afiliaciones_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
);

INSERT INTO comercios (nombre, direccion, categoria, descripcion, descripcion_en, estado, visitas, clics) VALUES
('Teddy Cafetería','Calle 63 #9-45, Chapinero, Bogotá','Cafetería','Café de especialidad, postres caseros y un ambiente acogedor en el corazón de Chapinero, Bogotá.','Specialty coffee, homemade desserts and a cozy atmosphere that will make you feel at home.','publicado',1253,321),
('La Candelaria Café','Carrera 3 #12-45, La Candelaria, Bogotá','Cafetería','Café de origen en una casa colonial del centro histórico.','Single-origin coffee in a colonial house in the historic center.','publicado',640,90),
('Café San Alberto','Carrera 7 #71-21, Chapinero, Bogotá','Cafetería','Café colombiano de finca propia, tostado a diario.','Colombian coffee from its own farm, roasted daily.','publicado',410,60),
('Casa Tinto','Carrera 5 #14-30, La Candelaria, Bogotá','Restaurante','Cocina bogotana tradicional: ajiaco, tamales y chocolate con queso.','Traditional Bogotá cuisine: ajiaco, tamales and hot chocolate with cheese.','publicado',300,40);
INSERT INTO fotos (comercio_id, archivo) VALUES (1,'/img/hero.jpg');
INSERT INTO resenas (comercio_id, autor, estrellas, texto) VALUES
(1,'James Walker',5,'Amazing coffee and super cozy place! The staff is very friendly.'),
(1,'Laura Gómez',5,'El mejor chocolate caliente de Chapinero y postres deliciosos.'),
(1,'Marc Dubois',4,'Très bon café, un peu plein le week-end.'),
(2,'Ana Torres',5,'Un lugar con mucha historia y muy buen café.'),
(3,'Luis Pardo',4,'Café excelente, el servicio podría ser más rápido.'),
(4,'Sofía Rojas',5,'El ajiaco más rico que he probado.');


-- Cuentas creadas (registro e inicio de sesión)
SELECT id, nombre, email, rol, codigo, referido_por FROM usuarios;

-- Negocios y su estado (borrador, pendiente o publicado)
SELECT id, nombre, estado, usuario_id, visitas, clics FROM comercios;

-- Reseñas
SELECT * FROM resenas ORDER BY fecha DESC;

-- Favoritos
SELECT * FROM favoritos;

-- Fotos subidas
SELECT * FROM fotos;
