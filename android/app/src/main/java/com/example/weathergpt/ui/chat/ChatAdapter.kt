package com.example.weathergpt.ui.chat

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.weathergpt.R
import com.example.weathergpt.data.models.ChatMessage

class ChatAdapter(
    private val messages: MutableList<ChatMessage>,
    private val onTtsClicked: (ChatMessage) -> Unit
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    companion object {
        private const val VIEW_TYPE_USER = 1
        private const val VIEW_TYPE_AI = 2
    }

    override fun getItemViewType(position: Int): Int {
        return if (messages[position].isUser) VIEW_TYPE_USER else VIEW_TYPE_AI
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return if (viewType == VIEW_TYPE_USER) {
            val view = inflater.inflate(R.layout.item_chat_user, parent, false)
            UserViewHolder(view)
        } else {
            val view = inflater.inflate(R.layout.item_chat_ai, parent, false)
            AiViewHolder(view)
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val message = messages[position]
        if (holder is UserViewHolder) {
            holder.tvMessage.text = message.text
            holder.tvTimestamp.text = message.timestamp
        } else if (holder is AiViewHolder) {
            holder.tvMessage.text = message.text
            holder.tvTimestamp.text = message.timestamp
            holder.btnTts.setOnClickListener {
                onTtsClicked(message)
            }
        }
    }

    override fun getItemCount(): Int = messages.size

    fun addMessage(message: ChatMessage) {
        messages.add(message)
        notifyItemInserted(messages.size - 1)
    }

    class UserViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvMessage: TextView = view.findViewById(R.id.tvUserMessage)
        val tvTimestamp: TextView = view.findViewById(R.id.tvUserTimestamp)
    }

    class AiViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvMessage: TextView = view.findViewById(R.id.tvAiMessage)
        val tvTimestamp: TextView = view.findViewById(R.id.tvAiTimestamp)
        val btnTts: ImageButton = view.findViewById(R.id.btnSpeakTts)
    }
}
