import express, { Request } from "express"
import "express-async-errors"
import cors from "cors"
import semver from "semver"
import fs from "fs"
import path from "path"
import formidable from "formidable"

const app = express()
app.use(cors())

const firmwaresDirectory = "./firmwares"

const getLatestAvailableVersion = () => {
  const firmwares = fs.readdirSync(firmwaresDirectory)
  const firmwareVersions = firmwares
    .map((f: any) => f.split("firmware_v").pop().split(".bin")[0])
    .sort((a, b) => (semver.gt(a, b) ? -1 : 1))

  return firmwareVersions[0]
}

app.get("/update", (req, res, next) => {
  const clientCurrentVersion = req.headers["x-esp8266-version"] as string

  const latest = getLatestAvailableVersion()

  if (!semver.gt(latest, clientCurrentVersion)) {
    console.log(`No update available: ${clientCurrentVersion} >= ${latest}`)
    res.status(304).send("No update available")
  } else {
    console.log(`Update available: ${clientCurrentVersion} < ${latest}`)

    const firmwarePath = path.resolve(
      firmwaresDirectory,
      `firmware_v${latest}.bin`
    )

    res.sendFile(firmwarePath)
  }
})

const parseForm = (req: Request) =>
  new Promise<any>((resolve, reject) => {
    const form = formidable({})
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })

const getSemverFromVersionFile = (filepath: string) => {
  const versionFileContent = fs.readFileSync(filepath, "utf8")
  // @ts-ignore
  return versionFileContent
    .split('define FIRMWARE_VERSION "')
    .pop()
    .split('"')[0]
}

app.post("/firmware", async (req, res, next) => {
  const { files } = await parseForm(req)

  if (!files.firmware || !files.version)
    throw "Missing firmware or version files"

  const version = getSemverFromVersionFile(files.version[0].filepath)

  fs.writeFileSync(
    path.resolve(firmwaresDirectory, `firmware_v${version}.bin`),
    fs.readFileSync(files.firmware[0].filepath)
  )

  res.send("OK")
})

app.listen(7070, () => {
  console.log(`Express listening`)
})
