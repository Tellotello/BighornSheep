// controllers/usersController.js
const sql = require("mssql");
const config = require("../configs/config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

// Sacar todos los usuarios
// Ruta: /usuarios
const getAllUsers = async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().execute("sp_GetAllUsuarios");
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error con DB", error: err });
  }
};

// Sacar un usuario por matricula
// Ruta: /usuarios/:matricula
const getUserByMatricula = async (req, res) => {
  const { matricula } = req.params;
  try {
    let pool = await sql.connect(config);
    let result = await pool
      .request()
      .input("Matricula", sql.VarChar(10), matricula)
      .execute("sp_GetUsuarioByMatricula");
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).send("User not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error con DB", error: err });
  }
};

// Crear un usuario con todos los datos
// Ruta: /usuarios (POST)
const createUser = async (req, res) => {
  const { Matricula, Nombre, Apellido, Contraseña, Carrera, Semestre } =
    req.body;
  try {
    let pool = await sql.connect(config);
    await pool
      .request()
      .input("Matricula", sql.VarChar(10), Matricula)
      .input("Nombre", sql.NVarChar(50), Nombre)
      .input("Apellidos", sql.NVarChar(50), Apellido)
      .input("Contraseña", sql.NVarChar(50), Contraseña)
      .input("Carrera", sql.NVarChar(50), Carrera)
      .input("Semestre", sql.Int, Semestre)
      .execute("sp_InsertUsuario");
    res.status(201).send("User created successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error con DB", error: err });
  }
};

// Registrar un usuario, solo con matricula y contraseña
// Ruta: /registro (POST)
const registerUser = async (req, res) => {
  const { Matricula, Contrasena } = req.body;
  if (!Matricula || !Contrasena)
    return res
      .status(400)
      .json({ message: "Matricula o Contraseña son requeridos" });

  try {
    // Hash password
    const hashedPwd = await bcrypt.hash(Contrasena, 10);

    let pool = await sql.connect(config);
    await pool
      .request()
      .input("Matricula", sql.VarChar(10), Matricula)
      .input("Contrasena", sql.NVarChar(256), hashedPwd)
      .execute("registroUsuario");
    res.status(201).send("User registered successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error con DB", error: err });
  }
};

const loginUser = async (req, res) => {
  const { Matricula, Contrasena } = req.body;
  if (!Matricula || !Contrasena)
    return res
      .status(400)
      .json({ message: "Matricula o Contraseña son requeridos" });

  try {
    let pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("p_Matricula", sql.VarChar(10), Matricula)
      .execute("sp_UserLogin");

    const hashedPwd = result.recordset[0].hashed_password;

    const passwordMatch = await bcrypt.compare(Contrasena, hashedPwd);

    if (passwordMatch) {
      // Create JWT

      const accessToken = jwt.sign(
        { Matricula: Matricula },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "50s" } //15min
      );
      const refreshToken = jwt.sign(
        { Matricula: Matricula },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" } //15min
      );

      //Saving Refresh token in DB
      await pool
        .request()
        .input("Matricula", sql.VarChar(10), Matricula)
        .input("RefreshToken", sql.Text, refreshToken)
        .execute("sp_RefreshTokenSet");

      //res.json({ roles, accessToken }); Para cuando se implementen los roles
      res.json({ accessToken });
    } else {
      res.status(401).send("Usuario o Contraseña incorrectos");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error con DB", error: err });
  }
};

module.exports = {
  getAllUsers,
  getUserByMatricula,
  createUser,
  registerUser,
  loginUser,
};
