import pool from "../config/db";
import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { loginSchema, registerSchema } from "../validations/auth.validations";

export const login = async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Input tidak valid", detail: parsed.error.issues });
        return;
    }
    const { email, password } = parsed.data;

    try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0]

    if (!user) {
        res.status(401).json({error: "Email atau password salah"})
        return;
    }

    const validateUser = await bcrypt.compare(password, user.password)
    if (!validateUser) {
        res.status(401).json({error : "Email atau password salah"})
        return;
    }

    const token = jwt.sign(
        {id : user.id, email : user.email, role : user.role},
        process.env.JWT_SECRET as string,
        {expiresIn : '7d'}
    )

    res.status(200).json({
        message : "Login berhasil",
        token,
        user : {id : user.id, email : user.email, role : user.role}
    });

    } catch (error) {
        console.error("Error saat login:", error);
        res.status(500).json({error : "Terjadi kesalahan pada server"})
    }

 }


 export const register = async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Input tidak valid", detail: parsed.error.issues });
        return;
    }
    const { nama, email, password, role } = parsed.data;

    try {
    const checkAvaiable = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if(checkAvaiable.rows.length) {
        res.status(400).json({error : "Email telah terdaftar"})
        return;
    }

    const hash = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, hash);

    const result = await pool.query(
        "INSERT INTO users (nama, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, nama, email, role",
        [nama, email, hashedPassword, role]
    );

    res.status(201).json({message : "Registrasi berhasil", user: result.rows[0]})

    } catch (error) {
        console.error("Error saat register:", error);
        res.status(500).json({error : "Terjadi kesalahan pada server"})
    }
 }
