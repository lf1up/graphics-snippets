/******************************************************************//**
* \brief   Implementation og generic interface for basic darwing.
* 
* \author  gernot
* \date    2018-02-04
* \version 1.0
**********************************************************************/
#pragma once
#ifndef OpenGLBasicDraw_h_INCLUDED
#define OpenGLBasicDraw_h_INCLUDED

// includes


// render

#include <IDraw.h>
#include <IBuffer.h>
#include <IRenderPass.h>

// OpenGL

#include <OpenGL_Matrix_Camera.h>
#include <OpenGL_SimpleShaderProgram.h>

// stl

#include <memory>


// calss declarations

/******************************************************************//**
* \brief General OpenGL namespace
**********************************************************************/
namespace OpenGL
{


//---------------------------------------------------------------------
// CBasicDraw
//---------------------------------------------------------------------


/******************************************************************//**
* @brief   Implementation for basic drawing.
*
* @author  gernot
* @date    2018-02-06
* @version 1.0
**********************************************************************/
class CBasicDraw
  : public Render::IDraw
{

  // TODO $$$ adaptie transparency
  // TODO $$$ unifrom blocks (model, view, projection)
  // TODO $$$ SSOA (3 frequences)
  // TODO $$$ text + greek letters
  // TODO $$$ post effects (cell (toon), sketch, gamma, hdr) - book of shaders
  // TOOO $$$ meshs

public:

  using TProgramPtr = OpenGL::ShaderProgram*;
  using TProcess    = std::unique_ptr<Render::IRenderProcess>;
  using TProgram    = std::unique_ptr<OpenGL::ShaderProgram>;
  

  CBasicDraw( void );
  virtual ~CBasicDraw();

  virtual Render::IDrawBuffer * NewDrawBuffer( Render::TDrawBufferUsage usage );
  virtual Render::IDrawBuffer & DrawBuffer( void );
  virtual Render::IDrawBuffer & DrawBuffer( const void *key, bool &cached );

  virtual void Destroy( void ) override;             //!< destroy all internal objects and clanup
  virtual bool Init( void ) override;                //!< general initializations
  virtual bool Begin( void ) override;               //!< start the rendering
  virtual bool ActivateBackground( void ) override;  //!< activate rendering to background
  virtual bool ActivateOpaque( void ) override;      //!< activate rendering to the opaque buffer
  virtual bool ActivateTransparent( void ) override; //!< activate rendering to the transparent buffer
  virtual bool Finish( void ) override;              //!< finish the rendering
  virtual bool ClearDepth( void ) override;          //!< interim clear of the depth buffer
 
  virtual void BackgroundColor( const Render::TColor &bg_color ) override {  _bg_color = bg_color; InvalidateProcess(); }; //!< sets the background color
  virtual void ViewportSize( const TSize &vp_size )              override { _vp_size = vp_size; InvalidateUniforms(); }    //!< sete the size of the viewport
  virtual void Projection( const Render::TMat44 &proj )          override { _projection = proj; InvalidateUniforms(); }    //!< set the projection matrix
  virtual void View( const Render::TMat44 &view )                override { _view = view; InvalidateUniforms(); }          //!< set the view matrix
  virtual void Model( const Render::TMat44 &model )              override { _model = model; InvalidateUniforms(); }        //!< set the model matrix
  
  virtual bool Draw( Render::TPrimitive primitive_type, size_t size, size_t coords_size, const Render::t_fp *coords, const Render::TColor &color, const TStyle &style ) override;

private:

  void InvalidateProcess( void );
  void InvalidateUniforms( void );

  bool SpecifyRenderProcess( void );
  bool UpdateUniforms( void );
  void DrawScereenspace( void );

  bool                                _initialized    = false;
  bool                                _drawing        = false;
  bool                                _unifroms_valid = false;
  size_t                              _current_pass   = 0;
  TProgramPtr                         _current_prog   = nullptr;
  const size_t                        _max_buffers    = 8;
  size_t                              _nextBufferI    = 0;
  std::array<const void*, 8>          _buffer_keys    { nullptr };
  std::array<Render::IDrawBuffer*, 8> _draw_buffers   { nullptr };
  TSize                               _vp_size        { 0 };
  Render::TMat44                      _projection     = OpenGL::Identity();
  Render::TMat44                      _view           = OpenGL::Identity();
  Render::TMat44                      _model          = OpenGL::Identity();
  Render::TColor                      _bg_color       { 0.0f };
  TProcess                            _process;
  TProgram                            _opaque_prog;
  TProgram                            _transp_prog;
  TProgram                            _finish_prog;

  const size_t c_opaque_pass = 1; //!< pass for opque drawing
  const size_t c_tranp_pass  = 2; //!< pass for tranparent drawing
  const size_t c_back_pass   = 3; //!< pass for drawing to background
  const size_t c_finish_pass = 4; //!< final pass (put it all together)
};

} // OpenGL

#endif // OpenGLBasicDraw_h_INCLUDED