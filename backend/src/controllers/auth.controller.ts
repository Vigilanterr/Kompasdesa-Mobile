import { error } from "node:console";
import pool from "../config/db";
import { Request, response } from "express";

 export const login = async (req: Request, res: Response) => {
    const [email, password] = req.body;
    if (!email || !password) {
        res.status(400).json({error: "wajib di isi"})

    const 

    }

    try {
        
    } catch (error) {
        
    }

 }