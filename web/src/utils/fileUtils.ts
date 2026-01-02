/**
 * 下载文件工具函数
 * @param blob - 文件 Blob 对象
 * @param filename - 文件名
 */
export const downloadFile = (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);

    // 添加到 DOM，触发下载，然后清理
    document.body.appendChild(link);
    link.click();

    // 清理资源
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 100);
};

/**
 * 生成带时间戳的文件名
 * @param prefix - 文件名前缀
 * @param extension - 文件扩展名
 * @returns 格式化的文件名
 */
export const generateTimestampedFilename = (prefix: string, extension: string): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}_${timestamp}.${extension}`;
};
