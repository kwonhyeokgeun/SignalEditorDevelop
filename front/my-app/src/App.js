import React, { useEffect } from "react"
import io from "socket.io-client"
import Codemirror from "codemirror"
import Select from "react-select"
import "codemirror/lib/codemirror.css"
import "codemirror/theme/monokai.css"
import "codemirror/mode/javascript/javascript"
import "codemirror/mode/clike/clike.js"
import "codemirror/mode/xml/xml"
import "codemirror/mode/python/python"

// import AceEditor from 'react-ace'
let roomId, socket, version, codemirror

const modeOptions = [
  { value: "text/html", label: "HTML" },
  { value: "javascript", label: "JavaScript" },
  { value: "text/x-java", label: "JAVA" },
  { value: "text/x-c++src", label: "C++" },
  { value: "python", label: "Python" },
]

const themeOptions = [
  { value: "monokai", label: "다크 모드" },
  { value: "default", label: "라이트 모드" },
]
const projectMeetingSetting = () => {
  socket = io("https://k8e103.p.ssafy.io:443", {
    secure: true,
    cors: { origin: "*" },
  })
  // socket = io('https://localhost:443', { secure: true, cors: { origin: '*' } })
  console.log("프로젝트 미팅 소켓 통신 시작!")

  roomId = "project1234"
}
function EditorTest() {
  if (socket == null) {
    projectMeetingSetting()

    socket.on("get_editor", (data) => {
      console.log("editor정보 받아옴")
      version = data.version
      codemirror.setValue(data.content)
    })

    socket.on("change_editor", (data) => {
      version = data.version
      let changes = data.changes
      codemirror.replaceRange(changes.text, changes.from, changes.to)
    })
    socket.on("rollback_editor", (data) => {
      version = data.version
      let content = data.content
      console.log("rollback_editor", content)
      console.log("cursor", codemirror.getCursor())
    })
  }

  /* function setContent(content) {
    codemirror.setValue(content)
  } */

  const [selectedMode, setSelectedMode] = React.useState(modeOptions[0])
  const handleMode = (selectedOption) => {
    setSelectedMode(selectedOption)
  }
  const [selectedTheme, setSelectedTheme] = React.useState(themeOptions[0])
  const handleTheme = (selectedOption) => {
    setSelectedTheme(selectedOption)
  }

  useEffect(() => {
    console.log("useEffect")
    codemirror = Codemirror.fromTextArea(
      document.getElementById("realtimeEditor"),
      {
        mode: { name: "javascript", json: true },
        theme: "monokai",
        lineNumbers: true,
      }
    )
    //codemirror.setOption("mode", "text/x-java")
    // codemirror.setOption("mode", "text/x-c++src")
    // codemirror.setOption("mode", "text/html")
    // codemirror.setOption("mode", "javascript")
    // codemirror.setOption("mode", "python")

    codemirror.on("change", (instance, changes) => {
      const { origin } = changes
      const content = instance.getValue()
      console.log("변화 상태:", origin)
      console.log("change:  ", changes)
      // onCodeChange(code)
      // input이면 입력, setValue는 받음, delete삭제, 한글은 *compose
      if (origin !== undefined && origin !== "setValue") {
        console.log(changes)
        socket.emit("change_editor", {
          roomId,
          changes,
          content,
          version: version++,
        })
      }
    })
    socket.emit("get_editor", { roomId })
    console.log("get_editor 소켓 보냄")
  }, [])

  useEffect(() => {
    codemirror.setOption("mode", selectedMode.value)
  }, [selectedMode])

  useEffect(() => {
    codemirror.setOption("theme", selectedTheme.value)
    console.log(selectedTheme.value)
  }, [selectedTheme])

  return (
    <div style={{ height: "100%", width: "100%" }}>
      코드편집기
      <Select
        options={modeOptions}
        onChange={handleMode}
        value={selectedMode}
      />
      <Select
        options={themeOptions}
        onChange={handleTheme}
        value={selectedTheme}
      />
      <textarea id="realtimeEditor"></textarea>
    </div>
  )
}
export default EditorTest
