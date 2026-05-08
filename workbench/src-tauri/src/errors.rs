use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("文件系统错误：{0}")]
    Io(#[from] std::io::Error),
    #[error("JSON 解析错误：{0}")]
    Json(#[from] serde_json::Error),
    #[error("无法定位应用设置目录")]
    MissingConfigDir,
}

pub type AppResult<T> = Result<T, AppError>;

pub fn to_command_error(error: AppError) -> String {
    error.to_string()
}
