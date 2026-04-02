import React from 'react';

const Message = ({ text, sender, timestamp }) => {
  const isUser = sender === 'user';

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-none'
            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
        }`}
      >
        <p className="text-sm md:text-base leading-relaxed break-words">{text}</p>
        <span className={`text-[10px] mt-1 block opacity-50 ${isUser ? 'text-right' : 'text-left'}`}>
          {timestamp}
        </span>
      </div>
    </div>
  );
};

export default Message;
