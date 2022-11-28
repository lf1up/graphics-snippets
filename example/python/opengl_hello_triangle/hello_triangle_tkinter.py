from OpenGL.GL import *
from ctypes import c_void_p, sizeof
import glm
import tkinter
import tkinter.ttk
import pyopengltk

sh_vert = """
#version 460 core

layout (location = 0) in vec4 a_position;
layout (location = 1) in vec4 a_color;
out vec4 v_color;
layout (location = 0) uniform mat4 u_projection;

void main() 
{
    v_color = a_color;
    gl_Position = u_projection * a_position;
}
"""

sh_frag = """
#version 460 core

out vec4 frag_color;
in vec4 v_color;

void main()
{
    frag_color = v_color;
}
"""

attributes = [
#    x       y     z    R  G  B  A
    -0.866, -0.75, 0,   1, 0, 0, 1, 
     0.866, -0.75, 0,   1, 1, 0, 1,
     0,      0.75, 0,   0, 0, 1, 1
]
attributes = (GLfloat * len(attributes))(*attributes)

class OpenGLApp(pyopengltk.OpenGLFrame):
    def __init__(self, *args, **kwds):
        super().__init__(*args, kwds) 
        self.__opengl_initialized = False

    def initgl(self):
        if not self.__opengl_initialized:
            self.__opengl_initialized = True

            vendor, renderer = glGetString(GL_VENDOR).decode("utf-8"), glGetString(GL_RENDERER).decode("utf-8")
            version, glsl_version = glGetString(GL_VERSION).decode("utf-8"), glGetString(GL_SHADING_LANGUAGE_VERSION).decode("utf-8")
            major, minor = glGetInteger(GL_MAJOR_VERSION), glGetInteger(GL_MINOR_VERSION)
            extensions = [glGetStringi(GL_EXTENSIONS, i) for i in range(glGetInteger(GL_NUM_EXTENSIONS))]
            print(f"\n{vendor} / {renderer}\n  OpenGL: {version}\n  GLSL: {glsl_version}\n  Context {major}.{minor}\n")

            @GLDEBUGPROC
            def __CB_OpenGL_DebugMessage(source, type, id, severity, length, message, userParam):
                msg = message[0:length]
                print(msg.decode("utf-8"))
            glDebugMessageCallback(__CB_OpenGL_DebugMessage, None)
            errors_only = False
            if errors_only:
                glDebugMessageControl(GL_DONT_CARE, GL_DONT_CARE, GL_DONT_CARE, 0, None, GL_FALSE)
                glDebugMessageControl(GL_DEBUG_SOURCE_API, GL_DEBUG_TYPE_ERROR, GL_DONT_CARE, 0, None, GL_TRUE)
            else:
                glDebugMessageControl(GL_DONT_CARE, GL_DONT_CARE, GL_DONT_CARE, 0, None, GL_TRUE)
            glEnable(GL_DEBUG_OUTPUT)
            glEnable(GL_DEBUG_OUTPUT_SYNCHRONOUS)
            glDebugMessageInsert(GL_DEBUG_SOURCE_APPLICATION, GL_DEBUG_TYPE_MARKER, 0, GL_DEBUG_SEVERITY_NOTIFICATION, -1, "Starting debug messaging service")

            vao = glGenVertexArrays(1)
            vbo = glGenBuffers(1)
            glBindVertexArray(vao)
            glBindBuffer(GL_ARRAY_BUFFER, vbo)
            glBufferData(GL_ARRAY_BUFFER, attributes, GL_STATIC_DRAW)
            glVertexAttribPointer(0, 3, GL_FLOAT, False, 7 * sizeof(GLfloat), None)
            glVertexAttribPointer(1, 4, GL_FLOAT, False, 7 * sizeof(GLfloat), c_void_p(3 * sizeof(GLfloat)))
            glEnableVertexAttribArray(0)
            glEnableVertexAttribArray(1)

            program_obj = glCreateProgram()
            for sh_type, sh_code in [(GL_VERTEX_SHADER, sh_vert), (GL_FRAGMENT_SHADER, sh_frag)]:
                shader_obj = glCreateShader(sh_type)
                glShaderSource(shader_obj, sh_code)
                glCompileShader(shader_obj)
                if not glGetShaderiv(shader_obj, GL_COMPILE_STATUS):
                    raise Exception(glGetShaderInfoLog(shader_obj).replace(b'\\n', b'\n'))
                glAttachShader(program_obj, shader_obj)
            glLinkProgram(program_obj)
            if not glGetProgramiv(program_obj, GL_LINK_STATUS):
                raise Exception(glGetProgramInfoLog(program_obj).replace(b'\\n', b'\n'))
            glUseProgram(program_obj)

            glEnable(GL_MULTISAMPLE) # default
            glEnable(GL_DEPTH_TEST)
            glClearColor(0.0, 0.0, 0.0, 0.0)

        glViewport(0, 0, self.width, self.height)
        aspect = self.width / self.height  
        if aspect >= 1:
            self.projection = glm.ortho(-aspect, aspect, -1, 1, -1, 1)
        else:
            self.projection = glm.ortho(-1, 1, -1/aspect, 1/aspect, -1, 1)  

    def redraw(self):
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
        glUniformMatrix4fv(0, 1, GL_FALSE, glm.value_ptr(self.projection))
        glDrawArrays(GL_TRIANGLES, 0, 3)
   
if __name__ == '__main__':
    root = tkinter.Tk()
    app = OpenGLApp(root, width=640, height=480)
    app.pack(fill=tkinter.BOTH, expand=tkinter.YES)
    app.animate = 1
    app.after(100, app.printContext)
    app.mainloop()
    exit()