import * as XLSX from 'xlsx'

import { useCallback, useEffect, useRef, useState } from 'react'
import { initFlowbite } from 'flowbite'

function App() {
  const [woorksheets, setWoorksheets] = useState([])
  const [filas, setFilas] = useState([])
  const [propiedades, setPropiedades] = useState([])
  const [status, setStatus] = useState(false)
  const [loading, setLoading] = useState(false)
  const [send, setSend] = useState(false)
  const prevExcel = useRef()

  useEffect(() => {
    initFlowbite()
    // initModals();
  }, [])

  // if (previousSearch.current === search) return;

  const leerExcel = useCallback((e) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    var excel = formData.get('excel')
    if (excel.name === '') return

    if (prevExcel.current === excel) return

    setLoading(true)

    prevExcel.current = excel
    // console.log('💻 - leerExcel - excel:', excel)
    var listWorksheet = []

    var reader = new FileReader()
    reader.readAsArrayBuffer(excel)
    reader.onloadend = async (e) => {
      var data = new Uint8Array(e.target.result)
      var excelRead = XLSX.read(data, { type: 'array' })
      // console.log(excelRead)
      excelRead.SheetNames.forEach(function (sheetName, index) {
        listWorksheet.push({
          data: excelRead.Sheets[sheetName],
          name: sheetName,
          index: index,
        })
      })

      var hoja = listWorksheet[0]
      for (let key in hoja.data) {
        let regEx = new RegExp('^(\\w)(1){1}$')
        if (regEx.test(key) == true) {
          propiedades.push(hoja.data[key].v)
        }
      }

      var hoja2 = listWorksheet[0]
      var filass = XLSX.utils.sheet_to_row_object_array(hoja2.data)
      setFilas(filass)
      setWoorksheets(listWorksheet)

      // setPropiedades(propiedades)
      setStatus(true)
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEnviarMensajeMasivos = async () => {
    try {
      for (const fila of filas.slice(0, 300)) {
        const message = `Saludos, *${fila.us_first_name} ${fila.us_last_name}* .  Vemos en nuestros records que su Licencia de Paciente de Cannabis Medicinal está vencida o próxima a vencerse.Usted adquirió el paquete (*${fila.pg_plan_name}*) por *$${fila.amount}*. Cómo paciente actual de Islandmed le ofrecemos un descuento de $10 al renovar su licencia con nosotros.\n Si desea más informacion envie la palabra *Info*`

        fila.us_phone = formatPhoneNumber(fila.us_phone)
        console.log(fila.us_phone)

        await sendMessage({ phone: fila.us_phone, message })
        await saveData(fila)
      }

      //Final de la ejecucion
      document.querySelector('#excel').value = ''
      setStatus(false)
      setFilas([])
      setWoorksheets([])
      setLoading(false)
    } catch (error) {
      console.log(error)
    }
  }

  function formatPhoneNumber(phoneNumberString) {
    var cleaned = ('' + phoneNumberString).replace(/\D/g, '')
    var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return '1' + match[1] + '' + match[2] + '' + match[3]
    }
    return '1' + phoneNumberString
  }

  const sendMessage = async ({ phone, message }) => {
    // const response = await fetch('http://localhost:3001/lead', {
    const response = await fetch(
      'https://botapiisla-production.up.railway.app/send-message-bot',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          message,
        }),
      }
    )
    return response
  }
  const saveData = async (item) => {
    setSend(true)
    // const data = await fetch('http://localhost:3007/api/send', {
    const data = await fetch(
      'https://apiisla-production.up.railway.app/api/send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      }
    )
    setSend(false)
    return data
    // console.log(response)
  }

  const handleChangeExcel = () => {
    console.log('input change')
    // if (filas.length > 0) {
    // console.log(filas)
    // setLoading(false)
    setStatus(false)
    // setPropiedades([])
    setFilas([])
    setWoorksheets([])

    // }
  }

  return (
    <div className="w-full h-full bg-slate-100">
      <div className="max-w-7xl  h-screen mx-auto p-8 flex flex-col gap-10">
        <div className=" bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
          <div className="p-5 ">
            <form
              className="flex flex-col md:flex-row items-center gap-3 "
              onSubmit={leerExcel}
            >
              <input
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                id="excel"
                name="excel"
                accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                type="file"
                onChange={handleChangeExcel}
              />
              <div className="flex gap-3 justify-between w-full md:w-auto">
                <input
                  type="submit"
                  value="Subir Archivo"
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5  dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                />
                {status && filas.length > 0 && (
                  <>
                    <button
                      disabled={send}
                      className="text-white bg-[#25D366] hover:bg-[#25D366] focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2  dark:bg-green-600 dark:hover:bg-[#25D366] focus:outline-none dark:focus:ring-[#25D366] flex gap-0 items-center"
                      onClick={handleEnviarMensajeMasivos}
                      data-tooltip-target="tooltip-send"
                      type="button"
                    >
                      {send ? (
                        <>
                          <svg
                            aria-hidden="true"
                            role="status"
                            className="inline w-4 h-4 me-3 text-white animate-spin"
                            viewBox="0 0 100 101"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                              fill="#E5E7EB"
                            />
                            <path
                              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                              fill="currentColor"
                            />
                          </svg>
                          Enviando
                        </>
                      ) : (
                        <svg
                          className="w-6 h-6"
                          role="img"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                        >
                          <title>WhatsApp</title>
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                      )}
                    </button>
                    <div
                      id="tooltip-send"
                      role="tooltip"
                      className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
                    >
                      Enviar mensaje a Whastsapp
                      <div className="tooltip-arrow" data-popper-arrow></div>
                    </div>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
        <div className=" bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 p-4">
          {loading ? (
            'Loading...'
          ) : (
            <>
              {status && filas.length > 0 ? (
                <>
                  <div className="relative overflow-x-auto overflow-y-scroll h-[60vh]">
                    <table className="w-full text-sm text-left  text-gray-500 dark:text-gray-400">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 ">
                        <tr>
                          <th>id</th>
                          {propiedades.map((propiedad, index) => {
                            if (propiedad === 'pg_fech') return
                            // console.log(propiedad, '')
                            return (
                              <th key={index} scope="col" className="px-4 py-2">
                                {propiedad === 'us_phone'
                                  ? 'PHONE_NUMBER'
                                  : propiedad}
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {filas.map((fila, index1) => {
                          return (
                            <tr
                              key={index1}
                              className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                            >
                              <td>{index1 + 1}</td>
                              {propiedades.map((propiedad, index2) => {
                                if (propiedad === 'pg_fech') return

                                return (
                                  <td key={index2} className="px-4 py-2">
                                    {fila[propiedad]}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                'No hay datos. Eliga un documentos Excel para cargar datos'
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
