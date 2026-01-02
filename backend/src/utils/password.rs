// src/utils/password.rs
// 密码哈希与验证

use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

use crate::errors::ApiError;

/// 对密码进行哈希
pub fn hash_password(password: &str) -> Result<String, ApiError> {
    let salt = SaltString::generate(&mut argon2::password_hash::rand_core::OsRng);
    let argon2 = Argon2::default();

    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|_| ApiError::PasswordHashError)?
        .to_string();

    Ok(password_hash)
}

/// 验证密码
pub fn verify_password(password: &str, hash: &str) -> Result<bool, ApiError> {
    let parsed_hash = PasswordHash::new(hash).map_err(|_| ApiError::PasswordHashError)?;

    let argon2 = Argon2::default();

    Ok(argon2
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hash_and_verify() {
        let password = "test_password_123";
        let hash = hash_password(password).unwrap();

        assert!(verify_password(password, &hash).unwrap());
        assert!(!verify_password("wrong_password", &hash).unwrap());
    }
}
