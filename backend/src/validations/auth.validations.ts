import { z } from 'zod'

export const login = z.object ({
    email : z.email(),
    password : z.string().min(6)
})

export const register = z.object ({
    email : z.email(),
    password : z.string().min(6)
})