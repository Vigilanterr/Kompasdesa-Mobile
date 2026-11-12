import express from 'express'
import { Response, Request } from 'express'

const PORT = 5000
const app = express()

app.get("/", (req:Request, res: Response) =>
    res.send("kntl.ts")
)

app.listen(PORT, () => {
    console.log("berhasil")
})