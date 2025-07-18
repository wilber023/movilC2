  const bcrypt = require('bcryptjs');
  const connectDB = require('../config/db');
  const { generateToken } = require('../config/auth');

  
  exports.register = async (req, res) => {
    try {
      const { username, pin } = req.body;

      if (!username || !pin) {
        return res.status(400).json({
          success: false,
          message: 'Por favor proporcione nombre de usuario y PIN'
        });
      }

      if (!/^\d{4,6}$/.test(pin)) {
        return res.status(400).json({
          success: false,
          message: 'El PIN debe contener entre 4 y 6 dígitos numéricos'
        });
      }

      const connection = await connectDB();

      
      const [users] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
      if (users.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario ya está en uso'
        });
      }

  
      const pin_hash = await bcrypt.hash(pin, 10);

  
      const [result] = await connection.execute(
        'INSERT INTO users (username, pin_hash) VALUES (?, ?)',
        [username, pin_hash]
      );

      
      const token = generateToken(result.insertId);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado correctamente',
        data: {
          id: result.insertId,
          username,
          token
        }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar usuario',
        error: error.message
      });
    }
  };

  
  exports.login = async (req, res) => {
    try {
      console.log('Login recibido:', req.body);
      const { username, pin } = req.body;

      if (!username || !pin) {
        return res.status(400).json({
          success: false,
          message: 'Por favor proporcione nombre de usuario y PIN'
        });
      }

      const connection = await connectDB();

      
      const [users] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      const user = users[0];

  
      const isMatch = await bcrypt.compare(pin, user.pin_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      
      const token = generateToken(user.id);

      res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        token,
        data: {
          id: user.id,
          username: user.username,
          token
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión',
        error: error.message
      });
    }
  };

  
  exports.verifyUser = async (req, res) => {
    try {
  
      res.status(200).json({
        success: true,
        message: 'Usuario verificado',
        data: {
          id: req.user.id,
          username: req.user.username
        }
      });
    } catch (error) {
      console.error('Error en verificación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar usuario',
        error: error.message
      });
    }
  };