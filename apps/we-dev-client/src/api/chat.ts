export const chat = async (messages: any) => {
  // 改成http请求
  const response = await fetch(process.env.APP_BASE_URL + "/api/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
  const data = await response.json();
  return data;
};
export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(process.env.APP_BASE_URL + "/api/upload", {

    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  const data = await response.json();
  console.log(data, "data");
  return data.data.data.url; // 假设返回的是 { url: "图片URL" }
};
