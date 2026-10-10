/* Fixed user password verifiers. This frontend-only gate is not server-side authentication. */
(function(root){
    const users = [
    {
        "username": "Vohra",
        "salt": "f7b57e48647df40dfab914582a52e216",
        "hash": "c491a88535477790414564e96e4128855c065abb6d934d8b82c5da885773f447",
        "iterations": 210000
    },
    {
        "username": "Parikh",
        "salt": "008b512ede7f3baed0bf6aee8fa8b6c5",
        "hash": "206bc4e1abe22cd3a270233e7b6ade172e52a5de5c5e65c2aaa57a8f83630d4b",
        "iterations": 210000
    },
    {
        "username": "Panchal",
        "salt": "352cc7dac59cf6ef7606a983b351603d",
        "hash": "9752b133583cc89e2f1822205076fc6a48e34e8c45a8940951d99eee1adbbcda",
        "iterations": 210000
    },
    {
        "username": "Navik",
        "salt": "e62fa2c03b5560035540899883b60796",
        "hash": "fdf207b73fd58a20c796b837002e6f7c5771e5d476f2e34d463efa36442f25f8",
        "iterations": 210000
    },
    {
        "username": "Shrivastav",
        "salt": "753272fa7aba740df2be14a6e4c61383",
        "hash": "30bbde5aeb8388fb125c9f3352cb94c2c91fd408b75c878c86fd77ec54aee7be",
        "iterations": 210000
    },
    {
        "username": "NMSKavachRoom",
        "salt": "cb81fbc2990031c4c50f3dcabef8ea3c",
        "hash": "af3a6b64f30f39a93fdd7d0be5d4e2bca707f01d6f985a7dbfe3ce9bd97a4def",
        "iterations": 210000
    },
    {
        "username": "NMSTestroom",
        "salt": "580ecc9ac8b8b2d91fe49790508c2cd5",
        "hash": "e575fef57f9661df4a8a0d12d1d8862f6ae8fc708d5d3a5556549e8f71f3387a",
        "iterations": 210000
    }
];
    root.LoginUsers = users;
    if(typeof module !== "undefined") module.exports = users;
})(typeof window !== "undefined" ? window : globalThis);
