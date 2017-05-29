defmodule PhxWebrtc.Web.PageController do
  use PhxWebrtc.Web, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
